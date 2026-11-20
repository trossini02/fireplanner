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
  assert.equal(r.methods.mc.dip.fallShare, 0);
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
  let s = 0;
  for (let p = 0; p < S.N; p++) s += Math.log(S.pl[p * (S.T + 1) + S.T]);
  const avg = Math.exp((s / (S.N * S.T)) * 12) - 1;
  assert.ok(Math.abs(avg - 0.02) < 0.003, `average ${avg}`);
  const ends = Array.from({ length: S.N }, (_, p) => S.pl[p * (S.T + 1) + S.T]).sort((a, b) => a - b);
  assert.ok(ends[Math.floor(S.N * 0.9)] / ends[Math.floor(S.N * 0.1)] > 1.1, 'price levels should spread out');

  const fixed = E.generateParametric({ ...inp, inflationRisk: { spread: 0, spikeYears: 0 } }, tl);
  for (let p = 0; p < 5; p++) assert.ok(Math.abs(fixed.pl[p * (S.T + 1) + S.T] - tl.pl[S.T]) < 1e-9);
});

test('random inflation leaves the drawn returns (before inflation) unchanged', () => {
  const base = flatInput({
    paths: 50,
    returns: { usStocks: 0.05, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
    vols: { usStocks: 0.16, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 },
  });
  const tl = E.buildTimeline(base, NOW);
  const a = E.generateParametric(base, tl);
  const b = E.generateParametric({ ...base, inflationRisk: { spread: 0.02, spikeYears: 10 } }, tl);
  for (let i = 0; i < a.port.length; i++) assert.ok(Math.abs(b.port[i] - a.port[i]) < 1e-5);
});

test('returns are before inflation: returns equal to inflation keep money at its value', async () => {
  // 2% returns with 2% inflation need the same capital, in today's money, as neither.
  const r = await E.analyze(flatInput({ inflation: 0.02, returns: { usStocks: 0.02, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 } }), NOW, null);
  assert.equal(r.methods.mc.capital, 140000);
  // The same 2% with 5% inflation loses value every year, so it needs more.
  const hot = await E.analyze(flatInput({ inflation: 0.05, returns: { usStocks: 0.02, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 } }), NOW, null);
  assert.ok(hot.methods.mc.capital > 140000, `${hot.methods.mc.capital}`);
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
  // Returns match inflation in both, so they are worth the same after it.
  const ret = (x) => ({ usStocks: x, worldStocks: 0, corpBonds: 0, govBonds: 0, metals: 0 });
  const inp = flatInput({ inflation: 0.03, returns: ret(0.03), retireYear: 2037, endAge: 80, units: { capital: 1000, monthly: 100 } });
  const calm = await E.analyze(inp, NOW, null);
  const hot = await E.analyze({ ...inp, inflation: 0.08, returns: ret(0.08) }, NOW, null);
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

test('flat world: every timing and buying rule gives the same closed-form answers', async () => {
  const split = { usStocks: 0.5, worldStocks: 0.3, corpBonds: 0, govBonds: 0.2, metals: 0 };
  for (const alloc of [undefined, split])
    for (const buyMode of ['split', 'rebal'])
      for (const timing of ['now', 'dip', 'smart']) {
        const r = await E.analyze(flatInput({ buyMode, timing, ...(alloc ? { alloc } : {}) }), NOW, null);
        const m = r.methods.mc;
        assert.equal(m.capital, 140000);
        assert.equal(m.plan.monthly, 9400, `${buyMode} ${timing}`);
        assert.equal(m.plan, m[timing]);
      }
});

test('yearly raise: the first-year amount grows by the chosen share each plan year', async () => {
  // 12 months of M, then 2 months of 1.1 × M must reach 130,804 → M = 9,211.5 → 9,300.
  const r = await E.analyze(flatInput({ contribGrowth: 0.1 }), NOW, null);
  assert.equal(r.methods.mc.now.monthly, 9300);
});

test('smart pair: 150% / 50% moved so the average is 100%', () => {
  for (const red of [0, 0.2, 0.35, 0.5, 0.6, 0.9]) {
    const s = E.smartPair(red);
    assert.ok(Math.abs(red * s.up + (1 - red) * s.down - 1) < 1e-12, `red ${red}`);
    assert.ok(s.up >= 1 && s.up <= 1.5 && s.down >= 0.5 && s.down <= 1);
  }
  assert.deepEqual([E.smartPair(0.5).up, E.smartPair(0.5).down], [1.5, 0.5]);
});

test('buying without selling: by the split, or into what has fallen behind it', () => {
  const w = [0.5, 0.5, 0, 0, 0];
  const h = [40, 50, 0, 0, 0];
  E.buy(h, w, 100, 90, true);
  assert.deepEqual(h, [95, 95, 0, 0, 0]); // enough to close the gap: exactly on the split
  const small = [40, 50, 0, 0, 0];
  E.buy(small, w, 5, 90, true);
  assert.deepEqual(small, [45, 50, 0, 0, 0]); // all of it to the asset behind
  const plain = [40, 50, 0, 0, 0];
  E.buy(plain, w, 100, 90, false);
  assert.deepEqual(plain, [90, 100, 0, 0, 0]);
});

// One hand-built scenario: stocks fall 20% in month 1, rise 10% in month 2 (US only), else flat.
function handPath(inp) {
  const tl = E.buildTimeline(inp, NOW);
  const T = tl.T;
  const Ta = tl.tTarget;
  const ra = new Float32Array(Ta * 5);
  const mk = new Float32Array(Ta);
  ra[1 * 5] = -0.2;
  mk[1] = -0.2;
  ra[2 * 5] = 0.1;
  mk[2] = 0.1;
  const S = { port: new Float32Array(T), dip: new Uint8Array(T), pl: new Float64Array(T + 1).fill(1), N: 1, T, Ta, ra, mk };
  return { tl, S };
}
const yearOne = (inp, mode, smart) => {
  const { tl, S } = handPath(inp);
  const rec = new Float32Array(Math.floor((tl.T - 1) / 12) + 1);
  E.runPlan(S, E.makeContext(inp, tl, smart), 100, mode, 1e9, rec);
  return rec[1]; // money after 12 months
};

test('timing rules only react to the month just ended', () => {
  const inp = flatInput({ buyDrop: 0.1 });
  // Every month: 100 falls to 80; (80 + 100) × 1.1 = 198; + 100 × 10 more months = 1,198.
  assert.ok(Math.abs(yearOne(inp, 'now') - 1198) < 1e-3);
  // After a fall: 200 saved by month 1 goes in after the 20% fall, then rises 10%; the rest waits.
  assert.ok(Math.abs(yearOne(inp, 'dip') - (220 + 1000)) < 1e-3);
  // Smart 150/50: 50 in, falls to 40; 150 after the red month (all the cash); 50 a month after.
  // Month 2: (40 + 150) × 1.1 = 209, + 50 × 10 green months invested, 500 still in cash.
  assert.ok(Math.abs(yearOne(inp, 'smart', { up: 1.5, down: 0.5 }) - (209 + 500 + 500)) < 1e-3);
});

test('rebalancing with new money ends with more of what fell', () => {
  const inp = flatInput({ alloc: { usStocks: 0.5, worldStocks: 0.5, corpBonds: 0, govBonds: 0, metals: 0 } });
  // Split: [50, 50] → [40, 50] + [50, 50]; US rises 10% (+9) → 199, + 1,000 = 1,199. Rebalancing
  // puts 55 of month 1's money into US instead of 50, so it gains 0.5 more from the rise.
  const split = yearOne({ ...inp, buyMode: 'split' }, 'now');
  const rebal = yearOne({ ...inp, buyMode: 'rebal' }, 'now');
  assert.ok(Math.abs(split - 1199) < 1e-3, `split ${split}`);
  assert.ok(Math.abs(rebal - 1199.5) < 1e-3, `rebal ${rebal}`);
});

test('one-number portfolio: history keeps its months, moved to the chosen growth and volatility', () => {
  require('../history.js');
  const H = globalThis.PAC_HISTORY;
  const inp = flatInput({ single: { growth: 0.05, vol: 0.12 }, alloc: { usStocks: 0.3, worldStocks: 0.4, corpBonds: 0.1, govBonds: 0.15, metals: 0.05 } });
  const [one, hist] = E.asSingle(inp, H);
  assert.equal(one.alloc.usStocks, 1);
  assert.equal(one.returns.usStocks, 0.05);
  const x = hist.real.usStocks.map((v) => Math.log(1 + v));
  const m = x.reduce((s, v) => s + v, 0) / x.length;
  const sd = Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / x.length);
  assert.ok(Math.abs(Math.exp(m * 12) - 1.05) < 1e-9); // inflation 0 here
  // With inflation, history (after inflation) is moved to the return less the inflation.
  const [, hist2] = E.asSingle({ ...inp, inflation: 0.025 }, H);
  const m2 = hist2.real.usStocks.reduce((s, v) => s + Math.log(1 + v), 0) / H.months;
  assert.ok(Math.abs(Math.exp(m2 * 12) - 1.05 / 1.025) < 1e-9);
  assert.ok(Math.abs(sd * Math.sqrt(12) - 0.12) < 1e-9);
  // The worst month of the mix stays the worst month.
  const mix = H.real.usStocks.map((_, h) => 0.3 * H.real.usStocks[h] + 0.4 * H.real.worldStocks[h] + 0.1 * H.real.corpBonds[h] + 0.15 * H.real.govBonds[h] + 0.05 * H.real.metals[h]);
  assert.equal(x.indexOf(Math.min(...x)), mix.indexOf(Math.min(...mix)));
  // In a flat world it changes nothing.
  return E.analyze(flatInput({ single: { growth: 0, vol: 0 } }), NOW, null).then((r) => assert.equal(r.methods.mc.now.monthly, 9400));
});

test('after a fall: savings go in anyway once the longest wait is reached', () => {
  const inp = flatInput({ buyDrop: 0.1, dip: { drop: 0.1, maxWaitMonths: 3 } });
  const { tl, S } = handPath(inp);
  S.ra[5 * 5] = 0.5; // US +50% in month 5
  S.mk[5] = 0.5;
  const rec = new Float32Array(Math.floor((tl.T - 1) / 12) + 1);
  E.runPlan(S, E.makeContext(inp, tl), 100, 'dip', 1e9, rec);
  // 200 in after month 1's fall → 220 after month 2. Months 2–4 wait, 300 in after month 4:
  // 520 × 1.5 = 780. 300 in after months 7 and 10: 1,380, plus 100 saved in month 11.
  assert.ok(Math.abs(rec[1] - 1480) < 1e-3, `${rec[1]}`);
});
