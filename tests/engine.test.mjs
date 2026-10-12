// Run: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../engine.js');

const NOW = { year: 2026, month: 9 }; // October 2026 → month 0 of the plan is Nov 2026

// A world with no risk, no growth, no inflation and no tax, so answers have closed forms.
function flatInput(over = {}) {
  const zero = { usStocks: 0, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 };
  return {
    units: { capital: 10000, monthly: 100 },
    age: 60,
    retireYear: 2028, // Jan 2028 = month 14
    endAge: 70, // month 120
    failTarget: 0.05,
    inflation: 0,
    inflationRisk: { spread: 0, spikeYears: 0 },
    historyCut: 0,
    spending: { essentials: 1234, extras: 0 },
    fireType: 'regular',
    barista: { income: 0, untilAge: 0 },
    housing: { kind: 'owned', payment: 0, paidOffYear: 0 },
    children: [],
    independentAge: 25,
    existing: 0,
    alloc: { usStocks: 1, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
    returns: { ...zero },
    vols: { ...zero },
    corr: E.DEFAULT_CORR,
    taxes: { equity: 0, gov: 0, other: 0, wealth: 0 },
    cash: { months: 6, rate: 0 },
    sellMonths: [3, 6, 10, 11],
    dip: { drop: 0.1, maxWaitMonths: 24 },
    maxDelayYears: 0,
    blockYears: 5,
    paths: 200,
    seed: 7,
    ...over,
  };
}

test('default correlation matrix is positive definite and Cholesky rebuilds it', () => {
  const L = E.cholesky(E.DEFAULT_CORR);
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      let s = 0;
      for (let k = 0; k < 5; k++) s += L[i][k] * L[j][k];
      assert.ok(Math.abs(s - E.DEFAULT_CORR[i][j]) < 1e-12);
    }
});

test('cholesky rejects a matrix that is not positive definite', () => {
  assert.throws(() => E.cholesky([[1, 2], [2, 1]]), /correlation/i);
});

test('smallestMultiple finds the first multiple that passes', async () => {
  const fail = async (x) => (x >= 123456 ? 0.01 : 0.5);
  assert.equal(await E.smallestMultiple(10000, fail, 0.05, 1, 1 << 20), 130000);
  assert.equal(await E.smallestMultiple(10000, fail, 0.05, 50, 1 << 20), 130000);
  assert.equal(await E.smallestMultiple(100, async () => 0, 0.05, 1, 100), 0);
  assert.equal(await E.smallestMultiple(100, async () => 1, 0.05, 1, 100), null);
});

test('timeline: month indexes, plan length, January and sell-month flags', () => {
  const tl = E.buildTimeline(flatInput(), NOW);
  assert.equal(tl.tTarget, 14);
  assert.equal(tl.T, 120);
  assert.equal(tl.calMonth(0), 10); // November
  assert.equal(tl.jan[2], 1); // Jan 2027
  assert.equal(tl.win[3], 0); // Feb
  assert.equal(tl.win[4], 0); // Mar
  assert.equal(tl.win[5], 1); // Apr
});

test('timeline: children, mortgage, rent and barista income start and stop on time', () => {
  const tl = E.buildTimeline(
    flatInput({
      inflation: 0.02,
      spending: { essentials: 1000, extras: 500 },
      fireType: 'barista',
      barista: { income: 300, untilAge: 65 },
      housing: { kind: 'mortgage', payment: 700, paidOffYear: 2030 },
      children: [{ birthYear: 2010, monthly: 400 }],
    }),
    NOW,
  );
  const real = (t) => tl.spend[t] / tl.pl[t];
  // Dec 2029 = month 37: mortgage (nominal 700) still paid; Jan 2030 = month 38: paid off.
  assert.ok(Math.abs(tl.spend[37] - ((1500 - 300 + 400) * tl.pl[37] + 700)) < 1e-9);
  assert.ok(Math.abs(tl.spend[38] - (1500 - 300 + 400) * tl.pl[38]) < 1e-9);
  // Barista income stops at age 65 = month 59.
  assert.ok(Math.abs(real(58) - (1500 - 300 + 400)) < 1e-9);
  assert.ok(Math.abs(real(59) - (1500 + 400)) < 1e-9);
  // Child born 2010, independent at 25: last cost in Dec 2034 (month 97), none from Jan 2035.
  assert.ok(Math.abs(real(97) - 1500) > 399);
  assert.ok(Math.abs(real(98) - 1500) < 1e-9);

  const rent = E.buildTimeline(flatInput({ inflation: 0.02, housing: { kind: 'rent', payment: 800, paidOffYear: 0 } }), NOW);
  assert.ok(Math.abs(rent.spend[50] - (1234 + 800) * rent.pl[50]) < 1e-9);
});

test('FIRE types: lean = essentials, regular = all, fat = all + 25%', () => {
  const s = { essentials: 1000, extras: 600 };
  const at = (fireType) => E.buildTimeline(flatInput({ spending: s, fireType }), NOW).spend[20];
  assert.equal(at('lean'), 1000);
  assert.equal(at('regular'), 1600);
  assert.equal(at('fat'), 2000);
});

test('flat world: capital needed equals total spending, rounded up to 10,000', async () => {
  const r = await E.analyze(flatInput(), NOW, null);
  // 106 months of 1,234 = 130,804 → 140,000
  assert.equal(r.methods.mc.capital, 140000);
});

test('flat world: monthly PAC fills the gap by the target year, rounded up to 100', async () => {
  const r = await E.analyze(flatInput(), NOW, null);
  // 14 contributions must reach 130,804 → 9,343.1 → 9,400
  assert.equal(r.methods.mc.now.monthly, 9400);
  assert.equal(r.methods.mc.now.retireDist[0], 1);
});

test('flat world: the flexible date keeps the PAC going up to 3 more years', async () => {
  const r = await E.analyze(flatInput({ maxDelayYears: 3 }), NOW, null);
  // Never reaches 140,000 early, retires anyway in Jan 2031 (month 50) needing 70 × 1,234 = 86,380
  // → 50 contributions of 1,800 = 90,000 is the first multiple of 100 that survives.
  assert.equal(r.methods.mc.now.monthly, 1800);
  assert.equal(r.methods.mc.now.retireDist[3], 1);
});

test('flat world: waiting for a dip that never comes invests the cash at retirement', async () => {
  const r = await E.analyze(flatInput(), NOW, null);
  assert.equal(r.methods.mc.dip.monthly, 9400);
  assert.equal(r.methods.mc.dip.dipHitRate, 0);
});

test('existing investments reduce the monthly PAC, and enough of them make it zero', async () => {
  const some = await E.analyze(flatInput({ existing: 60000 }), NOW, null);
  // (130,804 − 60,000) / 14 = 5,057.4 → 5,100
  assert.equal(some.methods.mc.now.monthly, 5100);
  const all = await E.analyze(flatInput({ existing: 200000 }), NOW, null);
  assert.equal(all.methods.mc.now.monthly, 0);
});

test('taxes only bite on gains; a wealth tax always costs capital', async () => {
  // Round to 1,000 so differences of a few thousand show.
  const fine = { units: { capital: 1000, monthly: 100 } };
  const noTax = await E.analyze(flatInput(fine), NOW, null);
  const taxNoGain = await E.analyze(flatInput({ ...fine, taxes: { equity: 0.26, gov: 0.26, other: 0.26, wealth: 0 } }), NOW, null);
  assert.equal(taxNoGain.methods.mc.capital, noTax.methods.mc.capital);

  const growth = { usStocks: 0.04, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 };
  const g0 = await E.analyze(flatInput({ ...fine, returns: growth }), NOW, null);
  const g26 = await E.analyze(flatInput({ ...fine, returns: growth, taxes: { equity: 0.26, gov: 0, other: 0, wealth: 0 } }), NOW, null);
  assert.ok(g26.methods.mc.capital > g0.methods.mc.capital, `${g26.methods.mc.capital} vs ${g0.methods.mc.capital}`);

  const wt = await E.analyze(flatInput({ ...fine, taxes: { equity: 0, gov: 0, other: 0, wealth: 0.01 } }), NOW, null);
  assert.ok(wt.methods.mc.capital > noTax.methods.mc.capital, `${wt.methods.mc.capital} vs ${noTax.methods.mc.capital}`);
});

test('retirement cash: top-ups only in sell months, forced one-month sales during a dip', () => {
  const inp = flatInput();
  const tl = E.buildTimeline(inp, NOW);
  const ctx = E.makeContext(inp, tl);
  const T = tl.T;
  const S = { port: new Float32Array(T), dip: new Uint8Array(T), pl: new Float64Array(T + 1).fill(1), N: 1, T };
  const trace = [];
  E.decumulate(S, 0, tl.tTarget, 200000, 200000, ctx, null, 0, 12, trace);
  const voluntary = trace.filter((s) => s.kind === 'window');
  assert.ok(voluntary.length > 0);
  assert.ok(voluntary.every((s) => tl.win[s.t] === 1));
  assert.ok(trace.every((s) => s.kind !== 'forced'));

  const crash = { ...S, dip: new Uint8Array(T).fill(1) };
  const trace2 = [];
  E.decumulate(crash, 0, tl.tTarget, 200000, 200000, ctx, null, 0, 12, trace2);
  const sales = trace2.filter((s) => s.kind !== 'initial');
  assert.ok(sales.length > 0);
  assert.ok(sales.every((s) => s.kind === 'forced'));
  // A forced sale only covers the next month.
  for (const s of sales) assert.ok(s.net <= tl.spend[s.t + 1] + 1e-6);
});

test('parametric returns have the requested growth and volatility', () => {
  const inp = flatInput({
    paths: 2000,
    returns: { usStocks: 0.05, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
    vols: { usStocks: 0.15, worldStocks: 0.15, corpBonds: 0.05, govBonds: 0.05, metals: 0.15 },
  });
  const tl = E.buildTimeline(inp, NOW);
  const { port } = E.generateParametric(inp, tl);
  let s = 0;
  let s2 = 0;
  for (let i = 0; i < port.length; i++) {
    const l = Math.log(1 + port[i]);
    s += l;
    s2 += l * l;
  }
  const mean = s / port.length;
  const sd = Math.sqrt(s2 / port.length - mean * mean);
  assert.ok(Math.abs(mean * 12 - Math.log(1.05)) < 0.004, `growth ${mean * 12}`);
  assert.ok(Math.abs(sd * Math.sqrt(12) - 0.15) < 0.005, `vol ${sd * Math.sqrt(12)}`);
});

test('block bootstrap copies consecutive runs of history of the block length', () => {
  const H = 240;
  const seq = Array.from({ length: H }, (_, i) => i / 100000);
  const zeros = new Array(H).fill(0);
  const history = { start: '1990-01', real: { usStocks: seq, worldStocks: zeros, corpBonds: zeros, govBonds: zeros, metals: zeros }, inflation: zeros };
  const inp = flatInput({ blockYears: 1, paths: 20 });
  const tl = E.buildTimeline(inp, NOW);
  const { port } = E.generateBootstrap(inp, tl, history);
  for (let p = 0; p < 20; p++)
    for (let b = 0; b + 12 <= tl.T; b += 12) {
      const first = Math.round(port[p * tl.T + b] * 100000);
      for (let k = 1; k < 12; k++) assert.equal(Math.round(port[p * tl.T + b + k] * 100000), (first + k) % H);
    }
});

test('dip flags mark months when stocks are at least the drop below their peak', () => {
  const H = 24;
  const us = new Array(H).fill(0);
  us[3] = -0.2;
  us[10] = 0.3;
  const zeros = new Array(H).fill(0);
  const history = { start: '1990-01', real: { usStocks: us, worldStocks: zeros, corpBonds: zeros, govBonds: zeros, metals: zeros }, inflation: zeros };
  const inp = flatInput({ blockYears: 1, paths: 30 });
  const tl = E.buildTimeline(inp, NOW);
  const { port, dip } = E.generateBootstrap(inp, tl, history);
  for (let p = 0; p < 30; p++) {
    let idx = 1;
    let peak = 1;
    for (let t = 0; t < tl.T; t++) {
      idx *= 1 + port[p * tl.T + t];
      peak = Math.max(peak, idx);
      assert.equal(dip[p * tl.T + t], idx < 0.9 * peak - 1e-6 ? 1 : 0);
    }
  }
});

test('same inputs give the same answer', async () => {
  const inp = flatInput({
    paths: 300,
    maxDelayYears: 3,
    returns: { usStocks: 0.05, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
    vols: { usStocks: 0.16, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
  });
  const a = await E.analyze(inp, NOW, null);
  const b = await E.analyze(inp, NOW, null);
  assert.deepEqual(a.methods.mc.capital, b.methods.mc.capital);
  assert.deepEqual(a.methods.mc.now.monthly, b.methods.mc.now.monthly);
  assert.ok(a.methods.mc.now.failRate <= 0.05);
});

test('with risk, more capital never fails more often', () => {
  const inp = flatInput({
    paths: 500,
    returns: { usStocks: 0.05, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
    vols: { usStocks: 0.16, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
  });
  const tl = E.buildTimeline(inp, NOW);
  const paths = E.generateParametric(inp, tl);
  const ctx = E.makeContext(inp, tl);
  let prev = 1;
  for (let c = 50000; c <= 200000; c += 10000) {
    const f = E.decumFailRate(paths, ctx, c);
    assert.ok(f <= prev + 1e-12);
    prev = f;
  }
});

// A synthetic history: H months of the given monthly real return for every asset and inflation.
function flatHistory(H, real = 0, infl = 0) {
  const col = () => new Array(H).fill(real);
  return {
    start: '1990-01',
    real: { usStocks: col(), worldStocks: col(), corpBonds: col(), govBonds: col(), metals: col() },
    inflation: new Array(H).fill(infl),
  };
}

test('random inflation keeps its long-run average and varies between scenarios', () => {
  const inp = flatInput({ paths: 2000, inflation: 0.02, inflationRisk: { spread: 0.015, spikeYears: 15 } });
  const tl = E.buildTimeline(inp, NOW);
  const S = E.generateParametric(inp, tl);
  // Returns are zero, so each month's portfolio return is that month's inflation.
  let s = 0;
  for (let i = 0; i < S.port.length; i++) s += Math.log(1 + S.port[i]);
  const avg = Math.exp((s / S.port.length) * 12) - 1;
  assert.ok(Math.abs(avg - 0.02) < 0.003, `average ${avg}`);
  const ends = Array.from({ length: S.N }, (_, p) => S.pl[p * (S.T + 1) + S.T]).sort((a, b) => a - b);
  assert.ok(ends[Math.floor(S.N * 0.9)] / ends[Math.floor(S.N * 0.1)] > 1.1, 'price levels should spread out');

  const fixed = E.generateParametric({ ...inp, inflationRisk: { spread: 0, spikeYears: 0 } }, tl);
  for (let p = 0; p < 5; p++) assert.ok(Math.abs(fixed.pl[p * (S.T + 1) + S.T] - tl.pl[S.T]) < 1e-9);
});

test('random inflation leaves the drawn returns unchanged', () => {
  const base = flatInput({
    paths: 50,
    returns: { usStocks: 0.05, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
    vols: { usStocks: 0.16, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
  });
  const tl = E.buildTimeline(base, NOW);
  const a = E.generateParametric(base, tl);
  const b = E.generateParametric({ ...base, inflationRisk: { spread: 0.02, spikeYears: 10 } }, tl);
  for (let p = 0; p < 50; p++)
    for (let t = 0; t < tl.T; t++) {
      const pi = b.pl[p * (tl.T + 1) + t + 1] / b.pl[p * (tl.T + 1) + t] - 1;
      const real = (1 + b.port[p * tl.T + t]) / (1 + pi) - 1;
      assert.ok(Math.abs(real - a.port[p * tl.T + t]) < 1e-5);
    }
});

test('block bootstrap replays historical inflation moved to the chosen average', () => {
  const H = 24;
  const hist = flatHistory(H);
  hist.inflation = Array.from({ length: H }, (_, i) => (i % 2 ? 0.006 : 0)); // averages ~3.7% a year
  const inp = flatInput({ paths: 10, inflation: 0.02, blockYears: 2 });
  const tl = E.buildTimeline(inp, NOW);
  const S = E.generateBootstrap(inp, tl, hist);
  for (let p = 0; p < 10; p++) {
    const g = Math.pow(S.pl[p * (S.T + 1) + 24] / S.pl[p * (S.T + 1)], 1 / 2) - 1;
    assert.ok(Math.abs(g - 0.02) < 1e-9, `two-year average ${g}`); // one full block = whole history
    const m = [0, 1].map((t) => S.pl[p * (S.T + 1) + t + 1] / S.pl[p * (S.T + 1) + t] - 1);
    assert.ok(Math.abs(m[0] - m[1]) > 0.005, 'the month-to-month swings survive the shift');
  }
});

test('a fixed nominal PAC buys less when inflation runs hot', async () => {
  // Ten years of PAC: money already invested keeps pace with inflation, later instalments do not.
  const inp = flatInput({ inflation: 0.03, retireYear: 2037, endAge: 80, units: { capital: 1000, monthly: 100 } });
  const calm = await E.analyze(inp, NOW, null);
  const hot = await E.analyze({ ...inp, inflation: 0.08 }, NOW, null);
  // Capital rises a little too (the cash buffer earns 0% here), but the PAC rises faster:
  // the same target in today's money costs more nominal euros by the retirement date.
  const ratio = (r) => r.methods.mc.now.monthly / r.methods.mc.capital;
  assert.ok(ratio(hot) > ratio(calm) * 1.15, `${ratio(hot)} vs ${ratio(calm)}`);
});

test('stress test: with no growth the money lasts exactly as long as it covers spending', () => {
  const inp = flatInput();
  const hist = flatHistory(120);
  // 50,000 / 1,234 a month = 40.5 months: the 41st month (index 40) cannot be paid.
  const short = E.stressTest(inp, NOW, hist, 0, 50000);
  assert.equal(short.months, 106); // the plan's retirement is shorter than the data
  assert.equal(short.ranOut, 40);
  const enough = E.stressTest(inp, NOW, hist, 0, 140000);
  assert.equal(enough.ranOut, -1);
  assert.ok(Math.abs(enough.endWealth - (140000 - 106 * 1234)) < 1e-6);
  const late = E.stressTest(inp, NOW, hist, 100, 50000);
  assert.equal(late.months, 20); // the data end first
  assert.equal(late.ranOut, -1);
});

test('stress test: sell windows follow the real calendar of the replayed months', () => {
  const inp = flatInput();
  const hist = flatHistory(120);
  // Start in April 1990 (history month 3): April is a sell month, so the first top-up comes then.
  const r = E.stressTest(inp, NOW, hist, 3, 140000);
  assert.ok(r.sales.window > 0);
  assert.equal(r.sales.forced, 0);
});

test('stress test on the real history: retiring in January 2000 with a 4% withdrawal', () => {
  require('../history.js');
  const H = globalThis.PAC_HISTORY;
  const inp = flatInput({
    age: 40,
    retireYear: 2027,
    endAge: 95,
    inflation: 0.02,
    spending: { essentials: 2000, extras: 0 },
    alloc: { usStocks: 0.3, worldStocks: 0.3, corpBonds: 0.1, govBonds: 0.25, metals: 0.05 },
  });
  const h0 = (2000 - 1990) * 12 - 6; // history starts July 1990
  const r = E.stressTest(inp, NOW, H, h0, 600000);
  assert.equal(r.months, H.months - h0);
  assert.ok(Number.isFinite(r.endWealth) && r.endWealth >= 0);
  assert.ok(r.lowest <= 600000);
});

test('minimal settings: a history haircut lowers every replayed return', () => {
  const hist = flatHistory(24, 0.004);
  const inp = flatInput({ paths: 3, blockYears: 2 });
  const tl = E.buildTimeline(inp, NOW);
  const a = E.generateBootstrap(inp, tl, hist);
  const b = E.generateBootstrap({ ...inp, historyCut: 0.005 }, tl, hist);
  for (let i = 0; i < 30; i++) assert.ok(Math.abs((1 + b.port[i]) / (1 + a.port[i]) - Math.pow(0.995, 1 / 12)) < 1e-6);
});
