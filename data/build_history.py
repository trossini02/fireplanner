#!/usr/bin/env python3
"""Build history.json: REAL monthly simple returns for 5 asset classes, plus US inflation.

Usage (openpyxl needed for the World Bank xlsx; run from the project root):
    python3 -I data/build_history.py --raw RAW_DIR --out history.js [--skip-download]

Downloads every source into RAW_DIR/<source-name>/ (one directory per source),
then parses those files, builds nominal monthly returns, deflates them by
FRED CPIAUCSL, cuts the common window and writes the output (.json, or .js
that sets globalThis.PAC_HISTORY for the page). Prints the sanity
checks (annualised real return / vol, worst calendar year, max drawdown,
correlations, known-fact checks) to stdout. No number is typed by hand.
"""

import argparse
import csv
import io
import json
import math
import os
import re
import sys
import urllib.request
import zipfile

KF = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/"
FRED = "https://fred.stlouisfed.org/graph/fredgraph.csv?id="
WB_PAGE = "https://www.worldbank.org/en/research/commodity-markets"
# Last known location; the page above is searched first because the path
# changes with each monthly Pink Sheet release.
WB_FALLBACK = ("https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-"
               "0050012026/related/CMO-Historical-Data-Monthly.xlsx")

SOURCES = {
    "kf-ff3": ("F-F_Research_Data_Factors_CSV.zip", KF + "F-F_Research_Data_Factors_CSV.zip"),
    "kf-developed3": ("Developed_3_Factors_CSV.zip", KF + "Developed_3_Factors_CSV.zip"),
    "fred-GS10": ("GS10.csv", FRED + "GS10"),
    "fred-BAA": ("BAA.csv", FRED + "BAA"),
    "fred-CPIAUCSL": ("CPIAUCSL.csv", FRED + "CPIAUCSL"),
    "wb-pinksheet": ("CMO-Historical-Data-Monthly.xlsx", None),  # URL discovered
}
SERIES = ["usStocks", "worldStocks", "govBonds", "corpBonds", "metals"]
UA = {"User-Agent": "Mozilla/5.0 (FIRE history data probe)"}


# ----------------------------------------------------------------- download
def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read(), r.geturl()


def pinksheet_url():
    try:
        html, _ = fetch(WB_PAGE)
        m = re.search(r'https?://[^"\'\s]*CMO-Historical-Data-Monthly\.xlsx', html.decode("utf-8", "replace"))
        if m:
            return m.group(0)
    except Exception as e:  # page layout/availability is outside our control
        print(f"warn: could not read {WB_PAGE}: {e}; using fallback URL", file=sys.stderr)
    return WB_FALLBACK


def download_all(raw):
    used = {}
    for name, (fname, url) in SOURCES.items():
        if url is None:
            url = pinksheet_url()
        d = os.path.join(raw, name)
        os.makedirs(d, exist_ok=True)
        body, final = fetch(url)
        with open(os.path.join(d, fname), "wb") as f:
            f.write(body)
        used[name] = url
        print(f"downloaded {name}: {len(body)} bytes from {final}", file=sys.stderr)
    with open(os.path.join(raw, "urls.json"), "w") as f:
        json.dump(used, f, indent=2)
    return used


# ------------------------------------------------------------------- parse
def ym_next(ym):
    y, m = ym
    return (y + 1, 1) if m == 12 else (y, m + 1)


def ym_prev(ym):
    y, m = ym
    return (y - 1, 12) if m == 1 else (y, m - 1)


def ym_str(ym):
    return f"{ym[0]:04d}-{ym[1]:02d}"


def kf_monthly_market(zip_path):
    """Ken French factor CSV (zipped): monthly Mkt = (Mkt-RF + RF)/100."""
    with zipfile.ZipFile(zip_path) as z:
        members = [n for n in z.namelist() if n.lower().endswith(".csv")]
        assert len(members) == 1, members
        text = z.read(members[0]).decode("latin-1")
    out, header, in_block = {}, None, False
    for line in text.splitlines():
        cells = [c.strip() for c in line.split(",")]
        if header is None and "Mkt-RF" in cells and "RF" in cells:
            header = cells
            in_block = True
            continue
        if not in_block:
            continue
        if not re.fullmatch(r"\d{6}", cells[0]):
            if out:
                break  # end of the monthly block (annual block follows)
            continue
        i_mkt, i_rf = header.index("Mkt-RF"), header.index("RF")
        mkt_rf, rf = float(cells[i_mkt]), float(cells[i_rf])
        if mkt_rf <= -99.99 or rf <= -99.99:
            continue  # KF missing-value code
        ym = (int(cells[0][:4]), int(cells[0][4:]))
        out[ym] = (mkt_rf + rf) / 100.0
    return out


def fred_series(csv_path):
    out = {}
    with open(csv_path, newline="") as f:
        rows = list(csv.reader(f))
    for r in rows[1:]:
        if len(r) < 2 or r[1] in ("", "."):
            continue
        y, m, _ = r[0].split("-")
        out[(int(y), int(m))] = float(r[1])
    return out


def pinksheet_column(xlsx_path, sheet, header):
    """One monthly column of the Pink Sheet, found by its header text."""
    import openpyxl  # venv dependency
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb[sheet]
    col, out = None, {}
    for row in ws.iter_rows(values_only=True):
        if col is None:
            for j, c in enumerate(row):
                if isinstance(c, str) and c.strip() == header:
                    col = j
            continue
        key = row[0]
        if isinstance(key, str) and re.fullmatch(r"\d{4}M\d{2}", key.strip()):
            v = row[col]
            if isinstance(v, (int, float)):
                out[(int(key[:4]), int(key[5:7]))] = float(v)
    assert col is not None, f"{header} column not found in {sheet}"
    return out


# --------------------------------------------------------------- transforms
def pct_change(levels):
    return {ym: levels[ym] / levels[ym_prev(ym)] - 1.0
            for ym in levels if ym_prev(ym) in levels}


def bond_return(y0, y1, maturity=10.0):
    """One-month total return of a par bond bought at yield y0 (decimal,
    semiannual coupons, coupon = y0), repriced one month later as a bond with
    maturity - 1/12 years left at yield y1, plus one month of coupon accrual."""
    n = 2.0 * (maturity - 1.0 / 12.0)          # remaining semiannual periods
    v = (1.0 + y1 / 2.0) ** (-n)
    price = (y0 / y1) * (1.0 - v) + v
    return price - 1.0 + y0 / 12.0


def bond_returns(yields_pct, maturity=10.0):
    return {ym: bond_return(yields_pct[ym_prev(ym)] / 100.0, yields_pct[ym] / 100.0, maturity)
            for ym in yields_pct if ym_prev(ym) in yields_pct}


# ------------------------------------------------------------------- stats
def stats(rets, months):
    n = len(rets)
    geo = math.prod(1.0 + r for r in rets) ** (12.0 / n) - 1.0
    mean = sum(rets) / n
    vol = math.sqrt(sum((r - mean) ** 2 for r in rets) / (n - 1)) * math.sqrt(12.0)
    years = {}
    for ym, r in zip(months, rets):
        years.setdefault(ym[0], []).append(r)
    full = {y: math.prod(1.0 + r for r in rs) - 1.0 for y, rs in years.items() if len(rs) == 12}
    worst_year = min(full, key=full.get)
    w, peak, peak_i, mdd, mdd_peak, mdd_trough = 1.0, 1.0, -1, 0.0, -1, -1
    for i, r in enumerate(rets):
        w *= 1.0 + r
        if w > peak:
            peak, peak_i = w, i
        dd = w / peak - 1.0
        if dd < mdd:
            mdd, mdd_peak, mdd_trough = dd, peak_i, i
    peak_label = "start" if mdd_peak < 0 else ym_str(months[mdd_peak])
    return {"geo": geo, "vol": vol, "worst_year": worst_year, "worst_year_ret": full[worst_year],
            "mdd": mdd, "mdd_peak": peak_label, "mdd_trough": ym_str(months[mdd_trough]),
            "full_years": f"{min(full)}-{max(full)}"}


def corr(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    return cov / math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))


def calendar_year(rets_by_month, year):
    ms = [(year, m) for m in range(1, 13)]
    if not all(ym in rets_by_month for ym in ms):
        return None
    return math.prod(1.0 + rets_by_month[ym] for ym in ms) - 1.0


# -------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True, help="raw download root (one subdir per source)")
    ap.add_argument("--out", required=True, help="output path: history.json, or history.js for the page")
    ap.add_argument("--skip-download", action="store_true", help="reuse files already in --raw")
    a = ap.parse_args()

    if a.skip_download:
        with open(os.path.join(a.raw, "urls.json")) as f:
            urls = json.load(f)
    else:
        urls = download_all(a.raw)
    p = {name: os.path.join(a.raw, name, fname) for name, (fname, _) in SOURCES.items()}

    nominal = {
        "usStocks": kf_monthly_market(p["kf-ff3"]),
        "worldStocks": kf_monthly_market(p["kf-developed3"]),
        "govBonds": bond_returns(fred_series(p["fred-GS10"]), 10.0),
        "corpBonds": bond_returns(fred_series(p["fred-BAA"]), 10.0),
    }
    # Precious metals: half gold, half the World Bank precious-metals index, rebalanced monthly.
    gold = pct_change(pinksheet_column(p["wb-pinksheet"], "Monthly Prices", "Gold"))
    pm = pct_change(pinksheet_column(p["wb-pinksheet"], "Monthly Indices", "Precious Metals"))
    nominal["metals"] = {m: 0.5 * gold[m] + 0.5 * pm[m] for m in gold if m in pm}
    cpi_levels = fred_series(p["fred-CPIAUCSL"])
    inflation = pct_change(cpi_levels)

    for k, v in nominal.items():
        print(f"nominal {k}: {ym_str(min(v))} .. {ym_str(max(v))} ({len(v)} months)", file=sys.stderr)
    print(f"inflation: {ym_str(min(inflation))} .. {ym_str(max(inflation))}", file=sys.stderr)

    # Common window: months where all 5 series and CPI exist. A block bootstrap
    # needs consecutive months, so if the overlap has holes (CPIAUCSL has no
    # October 2025 print) keep the longest unbroken run and report the rest.
    have = set(inflation)
    for v in nominal.values():
        have &= set(v)
    runs, ym, last = [], min(have), max(have)
    while ym <= last:
        if ym in have:
            if not runs or runs[-1][-1] != ym_prev(ym):
                runs.append([])
            runs[-1].append(ym)
        else:
            print(f"warn: month {ym_str(ym)} missing from at least one input", file=sys.stderr)
        ym = ym_next(ym)
    months = max(runs, key=len)
    start, end = months[0], months[-1]
    for r in runs:
        if r is not months:
            print(f"warn: dropped run {ym_str(r[0])}..{ym_str(r[-1])} ({len(r)} months)", file=sys.stderr)

    real = {k: [round((1.0 + nominal[k][m]) / (1.0 + inflation[m]) - 1.0, 5) for m in months]
            for k in SERIES}

    doc = {
        "start": ym_str(start),
        "end": ym_str(end),
        "months": len(months),
        "sources": {
            "usStocks": "Ken French Data Library, Fama/French 3 Factors monthly, Mkt = Mkt-RF + RF (CRSP value-weighted US market, total return) - " + urls["kf-ff3"],
            "worldStocks": "Ken French Data Library, Developed 3 Factors monthly (23 developed markets incl. US, USD), Mkt = Mkt-RF + RF - " + urls["kf-developed3"],
            "govBonds": "FRED GS10 (10y Treasury constant-maturity yield, monthly avg), synthetic 10y par-bond total return - " + urls["fred-GS10"],
            "corpBonds": "FRED BAA (Moody's Seasoned Baa corporate yield, monthly avg), synthetic 10y par-bond total return, no default losses - " + urls["fred-BAA"],
            "metals": "World Bank Pink Sheet CMO-Historical-Data-Monthly.xlsx: 50% gold (sheet 'Monthly Prices', Gold, USD/troy oz) + 50% sheet 'Monthly Indices', Precious Metals (gold, silver, platinum; 2010=100), rebalanced monthly, spot prices - " + urls["wb-pinksheet"],
            "inflation": "FRED CPIAUCSL (CPI-U all items, seasonally adjusted); real = (1+nominal)/(1+CPI change)-1 - " + urls["fred-CPIAUCSL"],
        },
        "real": real,
        # Monthly US CPI change, same months as `real`; the page shifts it to the user's average.
        "inflation": [round(inflation[m], 5) for m in months],
    }
    with open(a.out, "w") as f:
        if a.out.endswith(".js"):
            # Loaded by index.html with a plain <script>, so the page needs no fetch().
            f.write("// Generated by data/build_history.py - do not edit by hand.\n")
            f.write("globalThis.PAC_HISTORY = ")
            json.dump(doc, f, separators=(",", ":"))
            f.write(";\n")
        else:
            json.dump(doc, f, separators=(",", ":"))
    print(f"wrote {a.out}: {doc['start']}..{doc['end']}, {doc['months']} months, "
          f"{os.path.getsize(a.out)} bytes")

    # ------------------------------------------------ sanity checks (stdout)
    print("\nSanity checks on the REAL series in history.json")
    print(f"{'series':<12} {'geo/yr':>8} {'vol/yr':>8} {'worst yr':>9} {'year':>5} {'maxDD':>8}  DD peak -> trough")
    for k in SERIES:
        s = stats(real[k], months)
        print(f"{k:<12} {s['geo']:>8.2%} {s['vol']:>8.2%} {s['worst_year_ret']:>9.2%} {s['worst_year']:>5} "
              f"{s['mdd']:>8.2%}  {s['mdd_peak']} -> {s['mdd_trough']}   (full years {s['full_years']})")
    print("\nCorrelation of monthly real returns")
    print(" " * 12 + "".join(f"{k:>12}" for k in SERIES))
    for i in SERIES:
        print(f"{i:<12}" + "".join(f"{corr(real[i], real[j]):>12.2f}" for j in SERIES))

    print("\nKnown-fact checks (nominal, full downloaded history)")
    us = nominal["usStocks"]
    print(f"US stocks 2008 nominal (compounded KF monthly Mkt): {calendar_year(us, 2008):.2%}")
    print(f"World developed 2008 nominal: {calendar_year(nominal['worldStocks'], 2008):.2%}")
    gs10 = fred_series(p["fred-GS10"])
    pk = max(gs10, key=gs10.get)
    print(f"GS10 peak: {gs10[pk]:.2f}% in {ym_str(pk)}; 1981 max "
          f"{max(v for ym, v in gs10.items() if ym[0] == 1981):.2f}%")
    baa = fred_series(p["fred-BAA"])
    pk = max(baa, key=baa.get)
    print(f"BAA peak: {baa[pk]:.2f}% in {ym_str(pk)}")
    for y in (1994, 2008, 2009, 2022):
        print(f"  {y} nominal: govBonds {calendar_year(nominal['govBonds'], y):.2%}, "
              f"corpBonds {calendar_year(nominal['corpBonds'], y):.2%}, "
              f"metals {calendar_year(nominal['metals'], y):.2%}")
    us_real_all = {m: (1 + us[m]) / (1 + inflation[m]) - 1 for m in us if m in inflation}
    ms = sorted(us_real_all)
    g = math.prod(1 + us_real_all[m] for m in ms) ** (12 / len(ms)) - 1
    print(f"US stocks real geometric {ym_str(ms[0])}..{ym_str(ms[-1])} (CPIAUCSL starts 1947): {g:.2%}/yr")
    nom_geo = math.prod(1 + us[m] for m in sorted(us)) ** (12 / len(us)) - 1
    print(f"US stocks NOMINAL geometric {ym_str(min(us))}..{ym_str(max(us))}: {nom_geo:.2%}/yr")


if __name__ == "__main__":
    main()
