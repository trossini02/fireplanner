/* PAC FIRE planner — calculation engine.
 * Pure functions, no DOM. Runs in the browser (window.PacEngine) and in Node (require).
 * Money is in the user's currency. Rates are decimals. Month 0 of the plan is the month
 * after `now`. Inflation is random: every scenario carries its own price level, so
 * spending in month t of scenario p is real[t] × pl_p[t] + mortgage[t] (fixed nominal).
 */
(function (root) {
  'use strict';

  const ASSETS = ['usStocks', 'worldStocks', 'corpBonds', 'govBonds', 'metals'];

  // US stocks, World stocks, Corporate bonds, Government bonds, Precious metals.
  const DEFAULT_CORR = [
    [1.0, 0.9, 0.3, 0.0, 0.05],
    [0.9, 1.0, 0.35, 0.05, 0.1],
    [0.3, 0.35, 1.0, 0.7, 0.15],
    [0.0, 0.05, 0.7, 1.0, 0.15],
    [0.05, 0.1, 0.15, 0.15, 1.0],
  ];

  const FAT_FACTOR = 1.25;

  // Random inflation (Monte Carlo): the annual rate pulls back toward its centre by 3% of the
  // gap each month (half-life about 2 years); a spike adds SPIKE to it and fades the same way.
  const INFL_PULL = 0.97;
  const SPIKE = 0.05;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rand) {
    let spare = null;
    return function () {
      if (spare !== null) {
        const s = spare;
        spare = null;
        return s;
      }
      const u = 1 - rand();
      const v = rand();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
  }

  function cholesky(m) {
    const n = m.length;
    const L = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
      for (let j = 0; j <= i; j++) {
        let s = m[i][j];
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        if (i === j) {
          if (s <= 1e-12) throw new Error('The correlation matrix is not valid: some pairs contradict each other. Move the values closer to 0.');
          L[i][i] = Math.sqrt(s);
        } else L[i][j] = s / L[j][j];
      }
    return L;
  }

  // Smallest multiple of `unit` whose failure share is <= target; null when above the limit.
  async function smallestMultiple(unit, failAt, target, hintUnits, limitUnits) {
    if ((await failAt(0)) <= target) return 0;
    let lo = 0;
    let hi = Math.max(1, Math.ceil(hintUnits) || 1);
    while ((await failAt(hi * unit)) > target) {
      lo = hi;
      hi *= 2;
      if (hi > limitUnits) return null;
    }
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if ((await failAt(mid * unit)) <= target) hi = mid;
      else lo = mid;
    }
    return hi * unit;
  }

  function baseSpending(inp) {
    const { essentials, extras } = inp.spending;
    if (inp.fireType === 'lean') return essentials;
    if (inp.fireType === 'fat') return (essentials + extras) * FAT_FACTOR;
    return essentials + extras;
  }

  /* `real` is spending in today's money (mortgage excluded), `mort` the fixed nominal mortgage
   * payment. `pl` and `spend` follow the average inflation; they are for display only. */
  function buildTimeline(inp, now) {
    const startIdx = now.month + 1;
    const tTarget = Math.max(0, (inp.retireYear - now.year) * 12 - startIdx);
    const T = Math.round((inp.endAge - inp.age) * 12);
    const maxDelay = Math.max(0, inp.maxDelayYears | 0);
    if (inp.endAge <= inp.age) throw new Error('"Plan until age" must be higher than your age.');
    if (T < tTarget + 12 * maxDelay + 12)
      throw new Error('"Plan until age" must leave at least a year after the latest possible retirement (target year plus the extra years).');

    const calMonth = (t) => (startIdx + t) % 12;
    const yearOf = (t) => now.year + Math.floor((startIdx + t) / 12);
    const ageAt = (t) => inp.age + (t + 1) / 12;
    const g = Math.pow(1 + inp.inflation, 1 / 12);
    const base = baseSpending(inp);
    const sell = new Set(inp.sellMonths);

    const pl = new Float64Array(T + 1);
    const real = new Float64Array(T);
    const mort = new Float64Array(T);
    const spend = new Float64Array(T);
    const jan = new Uint8Array(T);
    const win = new Uint8Array(T);
    for (let t = 0; t <= T; t++) pl[t] = Math.pow(g, t);
    for (let t = 0; t < T; t++) {
      const y = yearOf(t);
      let r = base;
      if (inp.housing.kind === 'rent') r += inp.housing.payment;
      for (const c of inp.children) if (y >= c.birthYear && y < c.birthYear + inp.independentAge) r += c.monthly;
      if (inp.fireType === 'barista' && ageAt(t) < inp.barista.untilAge) r -= inp.barista.income;
      real[t] = r;
      if (inp.housing.kind === 'mortgage' && y < inp.housing.paidOffYear) mort[t] = inp.housing.payment;
      spend[t] = Math.max(0, r * pl[t] + mort[t]);
      jan[t] = calMonth(t) === 0 ? 1 : 0;
      win[t] = sell.has(calMonth(t)) ? 1 : 0;
    }
    return { T, tTarget, maxDelay, pl, real, mort, spend, jan, win, calMonth, yearOf, ageAt, now };
  }

  // What one month of retirement costs in today's money, split by source, at the target date.
  function spendingBreakdown(inp, tl) {
    const t = Math.min(tl.tTarget, tl.T - 1);
    const y = tl.yearOf(t);
    const { essentials, extras } = inp.spending;
    const lines = { essentials, extras: 0, fatHeadroom: 0, housing: 0, children: 0, barista: 0 };
    if (inp.fireType !== 'lean') lines.extras = extras;
    if (inp.fireType === 'fat') lines.fatHeadroom = (essentials + extras) * (FAT_FACTOR - 1);
    if (inp.housing.kind === 'rent') lines.housing = inp.housing.payment;
    if (inp.housing.kind === 'mortgage' && y < inp.housing.paidOffYear) lines.housing = inp.housing.payment / tl.pl[t];
    for (const c of inp.children) if (y >= c.birthYear && y < c.birthYear + inp.independentAge) lines.children += c.monthly;
    if (inp.fireType === 'barista' && tl.ageAt(t) < inp.barista.untilAge) lines.barista = -inp.barista.income;
    lines.total = tl.spend[t] / tl.pl[t];
    return lines;
  }

  function blendedTax(inp) {
    const a = inp.alloc;
    const tx = inp.taxes;
    return (a.usStocks + a.worldStocks) * tx.equity + a.govBonds * tx.gov + (a.corpBonds + a.metals) * tx.other;
  }

  function makeContext(inp, tl) {
    return {
      T: tl.T,
      tTarget: tl.tTarget,
      maxDelay: tl.maxDelay,
      real: tl.real,
      mort: tl.mort,
      jan: tl.jan,
      win: tl.win,
      tau: blendedTax(inp),
      wealthTax: inp.taxes.wealth,
      cashG: Math.pow(1 + inp.cash.rate * (1 - inp.taxes.other), 1 / 12),
      bufMonths: inp.cash.months,
      maxWait: inp.dip.maxWaitMonths,
      existing: inp.existing,
    };
  }

  function checkAlloc(inp) {
    let sum = 0;
    for (const a of ASSETS) sum += inp.alloc[a];
    if (Math.abs(sum - 1) > 0.001) throw new Error('The portfolio split must add up to 100%.');
  }

  function equityWeights(inp) {
    const s = inp.alloc.usStocks + inp.alloc.worldStocks;
    return s > 0 ? [inp.alloc.usStocks / s, inp.alloc.worldStocks / s] : null;
  }

  /* Shared tail of every generator: real returns and the month's inflation → nominal portfolio
   * return, the scenario's price level, and dip flags on the nominal stock index. */
  function makeSink(inp, T, N) {
    const port = new Float32Array(N * T);
    const dip = new Uint8Array(N * T);
    const pl = new Float64Array(N * (T + 1));
    const w = ASSETS.map((a) => inp.alloc[a]);
    const we = equityWeights(inp);
    const floor = 1 - inp.dip.drop;
    let idx = 1;
    let peak = 1;
    let level = 1;
    return {
      paths: { port, dip, pl, N, T },
      startPath(p) {
        idx = 1;
        peak = 1;
        level = 1;
        pl[p * (T + 1)] = 1;
      },
      put(p, t, r, pi) {
        let rp = 0;
        for (let k = 0; k < 5; k++) rp += w[k] * r[k];
        port[p * T + t] = (1 + rp) * (1 + pi) - 1;
        level *= 1 + pi;
        pl[p * (T + 1) + t + 1] = level;
        const re = we ? we[0] * r[0] + we[1] * r[1] : rp;
        idx *= (1 + re) * (1 + pi);
        if (idx > peak) peak = idx;
        dip[p * T + t] = idx < floor * peak ? 1 : 0;
      },
    };
  }

  // Monthly inflation for the Monte Carlo, on its own random stream so returns stay the same.
  function inflationStream(inp) {
    const mu = inp.inflation;
    const { spread, spikeYears } = inp.inflationRisk;
    const lam = spikeYears > 0 ? 1 / (12 * spikeYears) : 0;
    const centre = mu - (lam * SPIKE) / (1 - INFL_PULL); // keeps the long-run average at mu
    const sd = spread * Math.sqrt(1 - INFL_PULL * INFL_PULL);
    const rand = mulberry32(inp.seed + 2);
    const gauss = gaussian(rand);
    let a = mu;
    return {
      start() {
        a = mu;
      },
      next() {
        const pi = Math.pow(1 + a, 1 / 12) - 1;
        a = centre + INFL_PULL * (a - centre) + sd * gauss() + (rand() < lam ? SPIKE : 0);
        if (a < -0.05) a = -0.05;
        return pi;
      },
    };
  }

  function generateParametric(inp, tl) {
    checkAlloc(inp);
    const N = inp.paths;
    const T = tl.T;
    const L = cholesky(inp.corr);
    const mu = ASSETS.map((a) => Math.log(1 + inp.returns[a]) / 12);
    const sd = ASSETS.map((a) => inp.vols[a] / Math.sqrt(12));
    const gauss = gaussian(mulberry32(inp.seed));
    const infl = inflationStream(inp);
    const sink = makeSink(inp, T, N);
    const eps = new Float64Array(5);
    const r = new Float64Array(5);
    for (let p = 0; p < N; p++) {
      sink.startPath(p);
      infl.start();
      for (let t = 0; t < T; t++) {
        for (let k = 0; k < 5; k++) eps[k] = gauss();
        for (let i = 0; i < 5; i++) {
          let z = 0;
          for (let j = 0; j <= i; j++) z += L[i][j] * eps[j];
          r[i] = Math.exp(mu[i] + sd[i] * z) - 1;
        }
        sink.put(p, t, r, infl.next());
      }
    }
    return sink.paths;
  }

  /* History as the engine uses it: real returns less `historyCut` a year, and US inflation
   * moved so its average matches the user's (same ups and downs, different level). */
  function historyTables(inp, history) {
    const H = history.real.usStocks.length;
    const cut = Math.pow(1 - (inp.historyCut || 0), 1 / 12);
    const R = ASSETS.map((a) => Float64Array.from(history.real[a], (x) => (1 + x) * cut - 1));
    let m = 0;
    for (const x of history.inflation) m += Math.log(1 + x);
    m /= H;
    const shift = Math.log(1 + inp.inflation) / 12 - m;
    const I = Float64Array.from(history.inflation, (x) => (1 + x) * Math.exp(shift) - 1);
    return { R, I, H };
  }

  // Circular block bootstrap of historical months (returns and inflation together).
  function generateBootstrap(inp, tl, history) {
    checkAlloc(inp);
    const N = inp.paths;
    const T = tl.T;
    const { R, I, H } = historyTables(inp, history);
    const B = Math.max(1, Math.round(inp.blockYears * 12));
    const rand = mulberry32(inp.seed + 1);
    const sink = makeSink(inp, T, N);
    const r = new Float64Array(5);
    for (let p = 0; p < N; p++) {
      sink.startPath(p);
      for (let t = 0; t < T; ) {
        const s = Math.floor(rand() * H);
        for (let k = 0; k < B && t < T; k++, t++) {
          const h = (s + k) % H;
          for (let i = 0; i < 5; i++) r[i] = R[i][h];
          sink.put(p, t, r, I[h]);
        }
      }
    }
    return sink.paths;
  }

  /* Retirement of scenario p from month t0 with portfolio P (cost basis B). Returns the month
   * the money ran out, or -1. Cash is topped up to `bufMonths` of spending only in sell months
   * when stocks are not in a dip; otherwise only a forced sale covering next month.
   * `rec` (optional) receives wealth in today's money every `recStep` months; when that is
   * every month, slot T also gets the value left at the end. */
  function decumulate(S, p, t0, P, B, c, rec, recOff, recStep, trace) {
    const T = c.T;
    const off = p * T;
    const po = p * (T + 1);
    const tau = c.tau;
    const spendAt = (t) => {
      const s = c.real[t] * S.pl[po + t] + c.mort[t];
      return s > 0 ? s : 0;
    };
    let K = 0;
    const sell = (want, t, kind) => {
      if (want <= 0 || P <= 0) return;
      const keep = 1 - (P > B ? 1 - B / P : 0) * tau;
      let gross = want / keep;
      if (gross >= P) {
        gross = P;
        B = 0;
      } else B *= 1 - gross / P;
      P -= gross;
      K += gross * keep;
      if (trace) trace.push({ t, kind, net: gross * keep });
    };
    if (t0 >= T) return -1;
    let now = spendAt(t0);
    sell(c.bufMonths * now, t0, 'initial');
    for (let t = t0; t < T; t++) {
      if (rec && t % recStep === 0) rec[recOff + t / recStep] = (P + K) / S.pl[po + t];
      P *= 1 + S.port[off + t];
      if (c.jan[t] && P > 0) {
        P *= 1 - c.wealthTax;
        B *= 1 - c.wealthTax;
      }
      K = K * c.cashG - now;
      const next = t + 1 < T ? spendAt(t + 1) : 0;
      if (c.win[t] && !S.dip[off + t]) sell(c.bufMonths * now - K, t, 'window');
      else if (K < next) sell(next - K, t, 'forced');
      if (K < -1e-6) return t;
      now = next;
    }
    if (rec && recStep === 1) rec[recOff + T] = (P + K) / S.pl[po + T];
    return -1;
  }

  function decumFailRate(S, c, capital) {
    let fails = 0;
    for (let p = 0; p < S.N; p++) {
      const P0 = capital * S.pl[p * (S.T + 1) + c.tTarget];
      if (decumulate(S, p, c.tTarget, P0, P0, c, null, 0, 12, null) >= 0) fails++;
    }
    return fails / S.N;
  }

  /* Whole plan: existing money + monthly PAC (now, or parked in cash until a dip), flexible
   * retirement date (postpone a year while below the capital needed in that scenario's money,
   * up to maxDelay), then retirement. */
  function runPlan(S, c, M, mode, capital, rec) {
    const { port, dip, pl, N, T } = S;
    const nY = Math.floor((T - 1) / 12) + 1;
    const retire = new Array(c.maxDelay + 1).fill(0);
    let fails = 0;
    let dipHits = 0;
    for (let p = 0; p < N; p++) {
      const off = p * T;
      const po = p * (T + 1);
      const recOff = p * nY;
      let P = c.existing;
      let B = P;
      let W = 0;
      let invested = mode !== 'dip';
      let k = 0;
      let check = c.tTarget;
      let t = 0;
      for (;;) {
        if (t === check) {
          if (P + W >= capital * pl[po + t] || k === c.maxDelay) break;
          k++;
          check += 12;
        }
        if (rec && t % 12 === 0) rec[recOff + t / 12] = (P + W) / pl[po + t];
        P *= 1 + port[off + t];
        if (c.jan[t] && P > 0) {
          P *= 1 - c.wealthTax;
          B *= 1 - c.wealthTax;
        }
        if (invested) {
          P += M;
          B += M;
        } else {
          W = W * c.cashG + M;
          const hit = dip[off + t] === 1;
          if (hit || t + 1 >= c.maxWait) {
            if (hit) dipHits++;
            P += W;
            B += W;
            W = 0;
            invested = true;
          }
        }
        t++;
      }
      P += W;
      B += W;
      retire[k]++;
      if (decumulate(S, p, t, P, B, c, rec, recOff, 12, null) >= 0) fails++;
    }
    return {
      failRate: fails / N,
      retireDist: retire.map((n) => n / N),
      dipHitRate: mode === 'dip' ? dipHits / N : null,
    };
  }

  function percentile(sorted, q) {
    const i = (sorted.length - 1) * q;
    const lo = Math.floor(i);
    const hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }

  function fanFrom(rec, N, nY, age) {
    const qs = [0.1, 0.25, 0.5, 0.75, 0.9];
    const out = { ages: [], p10: [], p25: [], p50: [], p75: [], p90: [] };
    const col = new Float64Array(N);
    for (let y = 0; y < nY; y++) {
      for (let p = 0; p < N; p++) col[p] = rec[p * nY + y];
      col.sort();
      out.ages.push(age + y);
      const v = qs.map((q) => percentile(col, q));
      out.p10.push(v[0]);
      out.p25.push(v[1]);
      out.p50.push(v[2]);
      out.p75.push(v[3]);
      out.p90.push(v[4]);
    }
    return out;
  }

  const tick = () => new Promise((r) => setTimeout(r, 0));

  async function analyzeMethod(inp, tl, paths, onStep) {
    const c = makeContext(inp, tl);
    const U = inp.units;
    const target = inp.failTarget;
    const step = async (x) => {
      if (onStep) await onStep();
      return x;
    };

    const firstMonth = tl.spend[Math.min(tl.tTarget, tl.T - 1)] / tl.pl[tl.tTarget];
    const capital = await smallestMultiple(
      U.capital,
      async (x) => step(decumFailRate(paths, c, x)),
      target,
      (firstMonth * 12 * 25) / U.capital,
      1 << 22,
    );
    if (capital === null) throw new Error('No amount of capital keeps failures that low. Raise the accepted failure share.');
    const capitalNominal = capital * tl.pl[tl.tTarget];

    const plan = async (mode) => {
      const hint = capitalNominal / Math.max(1, tl.tTarget) / U.monthly;
      const monthly = await smallestMultiple(
        U.monthly,
        async (m) => step(runPlan(paths, c, m, mode, capital, null).failRate),
        target,
        hint,
        1 << 16,
      );
      if (monthly === null) return { monthly: null };
      return { monthly, ...runPlan(paths, c, monthly, mode, capital, null) };
    };
    const now = await plan('now');
    const dip = await plan('dip');

    let fan = null;
    if (now.monthly !== null) {
      const nY = Math.floor((tl.T - 1) / 12) + 1;
      const rec = new Float32Array(paths.N * nY);
      runPlan(paths, c, now.monthly, 'now', capital, rec);
      fan = fanFrom(rec, paths.N, nY, inp.age);
    }

    return {
      capital,
      capitalNominal,
      capitalFailRate: decumFailRate(paths, c, capital),
      withdrawalRate: capital > 0 ? (firstMonth * 12) / capital : 0,
      now,
      dip,
      fan,
    };
  }

  /* Both methods. `history` null skips the block bootstrap. `onProgress(done, total)` lets a
   * page repaint between steps. */
  async function analyze(inp, now, history, onProgress) {
    const tl = buildTimeline(inp, now);
    const methods = [['mc', () => generateParametric(inp, tl)]];
    if (history) methods.push(['block', () => generateBootstrap(inp, tl, history)]);
    const result = {
      tTarget: tl.tTarget,
      retireDate: { year: tl.yearOf(tl.tTarget), month: tl.calMonth(tl.tTarget) },
      breakdown: spendingBreakdown(inp, tl),
      methods: { mc: null, block: null },
    };
    let steps = 0;
    const expected = 60 * methods.length;
    const onStep = onProgress
      ? async () => {
          steps++;
          onProgress(Math.min(steps, expected - 1), expected);
          if (steps % 2 === 0) await tick();
        }
      : null;
    for (const [name, gen] of methods) {
      if (onStep) await tick();
      result.methods[name] = await analyzeMethod(inp, tl, gen(), onStep);
    }
    if (onProgress) onProgress(expected, expected);
    return result;
  }

  /* Historical stress test: retire with `capital` (today's money) at history month h0 and live
   * the plan's retirement spending on the real returns and inflation that followed, until the
   * data or the plan end. Sell months follow the real calendar. Money is in today's money. */
  function stressTest(inp, now, history, h0, capital) {
    checkAlloc(inp);
    const tl = buildTimeline(inp, now);
    const { R, I, H } = historyTables(inp, history);
    if (!(h0 >= 0 && h0 < H)) throw new Error('Pick a start month inside the history.');
    const L = Math.min(H - h0, tl.T - tl.tTarget);
    const m0 = Number(history.start.slice(5, 7)) - 1;
    const sell = new Set(inp.sellMonths);
    const cal = (k) => (m0 + h0 + k) % 12;
    const plT = tl.pl[tl.tTarget];
    const c = {
      T: L,
      real: tl.real.slice(tl.tTarget, tl.tTarget + L),
      mort: tl.mort.slice(tl.tTarget, tl.tTarget + L).map((x) => x / plT),
      jan: Uint8Array.from({ length: L }, (_, k) => (cal(k) === 0 ? 1 : 0)),
      win: Uint8Array.from({ length: L }, (_, k) => (sell.has(cal(k)) ? 1 : 0)),
      tau: blendedTax(inp),
      wealthTax: inp.taxes.wealth,
      cashG: Math.pow(1 + inp.cash.rate * (1 - inp.taxes.other), 1 / 12),
      bufMonths: inp.cash.months,
    };
    const sink = makeSink(inp, L, 1);
    sink.startPath(0);
    const r = new Float64Array(5);
    for (let k = 0; k < L; k++) {
      for (let i = 0; i < 5; i++) r[i] = R[i][h0 + k];
      sink.put(0, k, r, I[h0 + k]);
    }
    const S = sink.paths;
    const wealth = new Float64Array(L + 1);
    const trace = [];
    const ranOut = decumulate(S, 0, 0, capital, capital, c, wealth, 0, 1, trace);
    let spent = 0;
    for (let k = 0; k < (ranOut >= 0 ? ranOut + 1 : L); k++) spent += Math.max(0, c.real[k] + c.mort[k] / S.pl[k]);
    let low = capital;
    for (const x of wealth) if (x < low) low = x;
    return {
      h0,
      months: L,
      ranOut,
      wealth,
      dips: S.dip,
      priceLevel: S.pl[L],
      endWealth: ranOut >= 0 ? 0 : wealth[L],
      lowest: ranOut >= 0 ? 0 : low,
      spent,
      sales: {
        window: trace.filter((s) => s.kind === 'window').length,
        forced: trace.filter((s) => s.kind === 'forced').length,
      },
    };
  }

  const api = {
    ASSETS,
    DEFAULT_CORR,
    cholesky,
    smallestMultiple,
    buildTimeline,
    spendingBreakdown,
    makeContext,
    generateParametric,
    generateBootstrap,
    decumulate,
    decumFailRate,
    runPlan,
    analyze,
    stressTest,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PacEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
