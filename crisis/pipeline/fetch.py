import csv
import datetime
import io
import json
import math
import os
import re
import sys
import time
import traceback
import urllib.parse
import urllib.request
import warnings

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT, "config", "indicators.json")
RAW_DIR = os.path.join(ROOT, "data", "raw")
STATUS_PATH = os.path.join(ROOT, "data", "fetch_status.json")
USER_AGENT = "python-urllib/3.9"
YAHOO_USER_AGENT = "Mozilla/5.0"
TIMEOUT = 60
PAUSE_SECONDS = 1

CN_QUARTERS = {"第一季度": 1, "第二季度": 4, "第三季度": 7, "第四季度": 10}


class FetchError(Exception):
    pass


def http_get(url, user_agent=USER_AGENT):
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return resp.read()


def parse_date(raw):
    if isinstance(raw, (datetime.date, datetime.datetime)):
        return raw.strftime("%Y-%m-%d")
    text = str(raw).strip()
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})(?: 00:00:00)?", text)
    if m:
        return "%s-%s-%s" % m.groups()
    m = re.fullmatch(r"(\d{4})年(\d{1,2})月份?", text)
    if m:
        return "%s-%02d-01" % (m.group(1), int(m.group(2)))
    m = re.fullmatch(r"(\d{4})(\d{2})", text)
    if m:
        return "%s-%s-01" % m.groups()
    m = re.fullmatch(r"(\d{4})-(\d{2})", text)
    if m:
        return "%s-%s-01" % m.groups()
    m = re.fullmatch(r"(\d{4})年(第[一二三四]季度)", text)
    if m:
        return "%s-%02d-01" % (m.group(1), CN_QUARTERS[m.group(2)])
    raise FetchError("无法识别的日期：%r" % (raw,))


def to_float(raw):
    if raw is None:
        return None
    if isinstance(raw, str):
        raw = raw.strip()
        if raw in ("", ".", "NA", "nan"):
            return None
    value = float(raw)
    if math.isnan(value):
        return None
    return value


def fetch_fred(source):
    series = source["series"]
    url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=" + urllib.parse.quote(series)
    text = http_get(url).decode("utf-8")
    reader = csv.reader(io.StringIO(text))
    header = next(reader, None)
    if header != ["observation_date", series]:
        raise FetchError("美联储返回的表头不对：%r" % (header,))
    rows = []
    for line in reader:
        if len(line) != 2:
            raise FetchError("美联储返回的行格式不对：%r" % (line,))
        value = to_float(line[1])
        if value is not None:
            rows.append((parse_date(line[0]), value))
    return rows


def fetch_yahoo(source):
    period2 = int(time.time()) + 86400
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + urllib.parse.quote(source["symbol"])
        + "?period1=-2208988800&period2=%d&interval=1d" % period2
    )
    data = json.loads(http_get(url, YAHOO_USER_AGENT))
    result = data["chart"]["result"][0]
    offset = result["meta"]["gmtoffset"]
    closes = result["indicators"]["quote"][0]["close"]
    rows = []
    for ts, close in zip(result["timestamp"], closes):
        if close is None:
            continue
        day = datetime.datetime.utcfromtimestamp(ts + offset).strftime("%Y-%m-%d")
        rows.append((day, float(close)))
    return rows


def find_link(page_url, pattern):
    html = http_get(page_url).decode("utf-8", "replace")
    m = re.search(pattern, html)
    if not m:
        raise FetchError("页面 %s 里找不到下载链接" % page_url)
    return urllib.parse.urljoin(page_url, m.group(1))


def fetch_shiller(source):
    import xlrd

    link = find_link(source["page"], r'href="([^"]*ie_data\.xls(?:\?[^"]*)?)"')
    book = xlrd.open_workbook(file_contents=http_get(link))
    sheet = book.sheet_by_name(source["sheet"])
    col = source["column"]
    rows = []
    for r in range(sheet.nrows):
        date_cell = sheet.cell_value(r, 0)
        if not isinstance(date_cell, float):
            continue
        year, month = ("%.2f" % date_cell).split(".")
        if not 1 <= int(month) <= 12:
            raise FetchError("席勒数据日期无法识别：%r" % date_cell)
        cell = sheet.cell_value(r, col)
        value = cell if isinstance(cell, float) else to_float(cell)
        if value is not None:
            rows.append(("%s-%s-01" % (year, month), value))
    return rows


def fetch_finra(source):
    import openpyxl

    link = find_link(source["page"], r'href="([^"]*margin-statistics[^"]*\.xlsx)"')
    book = openpyxl.load_workbook(io.BytesIO(http_get(link)), read_only=True, data_only=True)
    sheet = book.worksheets[0]
    lines = list(sheet.iter_rows(values_only=True))
    header = lines[0]
    if header[0] != "Year-Month" or not str(header[1]).startswith("Debit Balances"):
        raise FetchError("FINRA 文件表头不对：%r" % (header,))
    rows = []
    for line in lines[1:]:
        if line[0] is None:
            continue
        value = to_float(line[1])
        if value is not None:
            rows.append((parse_date(line[0]), value))
    return rows


def fill_params(value, params):
    if isinstance(value, str):
        return value.format(**params)
    if isinstance(value, dict):
        return {k: fill_params(v, params) for k, v in value.items()}
    return value


def fetch_akshare(source, params):
    import akshare

    source = fill_params(source, params)
    func = getattr(akshare, source["func"], None)
    if func is None:
        raise FetchError("akshare 没有接口 %s" % source["func"])
    df = func(**source["kwargs"])
    if df is None or len(df) == 0:
        raise FetchError("akshare 接口 %s 返回空表" % source["func"])
    scale = source.get("scale", 1)
    rows = []
    if "wide_row" in source:
        names = [str(i).strip() for i in df.index]
        if source["wide_row"] not in names:
            raise FetchError("返回的表里没有行 %s" % source["wide_row"])
        series = df.iloc[names.index(source["wide_row"])]
        for col, raw in series.items():
            value = to_float(raw)
            if value is not None:
                rows.append((parse_date(col), value * scale))
        return rows
    for col in [source["date_col"], source["value_col"]] + list(source.get("filter", {})):
        if col not in df.columns:
            raise FetchError("返回的表里没有列 %s" % col)
    for _, record in df.iterrows():
        if any(str(record[k]).strip() != v for k, v in source.get("filter", {}).items()):
            continue
        value = to_float(record[source["value_col"]])
        if value is not None:
            rows.append((parse_date(record[source["date_col"]]), value * scale))
    return rows


def fetch_source(source, params):
    kind = source["type"]
    if kind == "fred":
        return fetch_fred(source)
    if kind == "yahoo":
        return fetch_yahoo(source)
    if kind == "shiller":
        return fetch_shiller(source)
    if kind == "finra":
        return fetch_finra(source)
    if kind == "akshare":
        return fetch_akshare(source, params)
    raise FetchError("不认识的来源类型 %s" % kind)


def check_rows(rows):
    if not rows:
        raise FetchError("没有任何有效数据")
    rows = sorted(rows)
    dates = [d for d, _ in rows]
    if len(set(dates)) != len(dates):
        dup = sorted({d for d in dates if dates.count(d) > 1})[:5]
        raise FetchError("日期重复：%s" % ", ".join(dup))
    return rows


def fetch_item(item):
    source = item["source"]
    params = item.get("params", {})
    if source["type"] != "concat":
        rows = check_rows(fetch_source(source, params))
        return rows, [{"source": describe(source), "start": rows[0][0], "end": rows[-1][0], "rows": len(rows)}]
    merged = []
    segments = []
    for part in source["parts"]:
        part_rows = check_rows(fetch_source(part, params))
        if merged:
            last = merged[-1][0]
            part_rows = [r for r in part_rows if r[0] > last]
        if part_rows:
            segments.append({"source": describe(part), "start": part_rows[0][0], "end": part_rows[-1][0], "rows": len(part_rows)})
        merged.extend(part_rows)
        time.sleep(PAUSE_SECONDS)
    return check_rows(merged), segments


def describe(source):
    kind = source["type"]
    if kind == "fred":
        return "fred:" + source["series"]
    if kind == "yahoo":
        return "yahoo:" + source["symbol"]
    if kind == "akshare":
        return "akshare:" + source["func"]
    return kind


def read_csv_range(path):
    if not os.path.exists(path):
        return None
    with open(path, newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        dates = [line[0] for line in reader if line]
    if not dates:
        return None
    return {"rows": len(dates), "start": dates[0], "end": dates[-1]}


def format_value(value):
    text = "%.6f" % value
    return text.rstrip("0").rstrip(".") if "." in text else text


def write_csv(path, rows):
    tmp = path + ".tmp"
    with open(tmp, "w", newline="") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(["date", "value"])
        for day, value in rows:
            writer.writerow([day, format_value(value)])
    os.replace(tmp, path)


def skip_reason(item):
    kind = item["source"]["type"]
    if kind == "manual":
        return "人工录入，不自动取数"
    if kind == "derived":
        return "由编号 %s 计算，不单独取数" % item["source"]["from"]
    if "city" in item.get("params", {}) and not item["params"]["city"]:
        return "没有配置城市"
    return None


def last_ok_at(status):
    if "last_ok_at" in status:
        return status["last_ok_at"]
    return status["fetched_at"] if status["result"] == "ok" else None


def run_one(item, now, last_ok):
    path = os.path.join(RAW_DIR, "%s.csv" % item["id"])
    status = {"id": item["id"], "name": item["name"], "fetched_at": now, "last_ok_at": last_ok}
    reason = skip_reason(item)
    if reason:
        status.update({"result": "skipped", "reason": reason})
        return status
    old = read_csv_range(path)
    try:
        rows, segments = fetch_item(item)
        if old and rows[0][0] > old["start"]:
            raise FetchError("历史变短：新数据从 %s 开始，上次从 %s 开始" % (rows[0][0], old["start"]))
        write_csv(path, rows)
        status.update({"result": "ok", "last_ok_at": now, "rows": len(rows), "start": rows[0][0], "end": rows[-1][0], "segments": segments, "error": None})
    except Exception as exc:
        message = "%s: %s" % (type(exc).__name__, exc)
        status.update({"result": "failed", "error": message, "kept_previous_file": old is not None})
        if old:
            status.update(old)
        status["traceback"] = traceback.format_exc(limit=3)
    return status


def print_summary(statuses):
    print()
    print("%-6s %-8s %8s  %-10s  %-10s  %s" % ("编号", "结果", "行数", "起", "止", "名称"))
    for s in statuses:
        print("%-6s %-8s %8s  %-10s  %-10s  %s" % (
            s["id"], s["result"], s.get("rows", "-"), s.get("start", "-"), s.get("end", "-"), s["name"]))
    skipped = [s for s in statuses if s["result"] == "skipped"]
    failed = [s for s in statuses if s["result"] == "failed"]
    print()
    print("跳过 %d 项：" % len(skipped))
    for s in skipped:
        print("  %s %s：%s" % (s["id"], s["name"], s["reason"]))
    print()
    print("失败清单（%d 项）：" % len(failed))
    for s in failed:
        kept = "已保留上次文件" if s["kept_previous_file"] else "没有上次文件"
        print("  %s %s：%s（%s）" % (s["id"], s["name"], s["error"], kept))
    if not failed:
        print("  无")


def main():
    warnings.filterwarnings("ignore")
    with open(CONFIG_PATH, encoding="utf-8") as f:
        config = json.load(f)
    os.makedirs(RAW_DIR, exist_ok=True)
    previous = {}
    if os.path.exists(STATUS_PATH):
        with open(STATUS_PATH, encoding="utf-8") as f:
            previous = json.load(f)
    items = config.get("reference_series", []) + config["indicators"]
    statuses = []
    for item in items:
        now = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
        print("取数 %s %s ..." % (item["id"], item["name"]), flush=True)
        status = run_one(item, now, last_ok_at(previous[item["id"]]) if item["id"] in previous else None)
        statuses.append(status)
        print("  %s" % (status.get("error") or status.get("reason") or "%s 行" % status["rows"]), flush=True)
        if status["result"] != "skipped":
            time.sleep(PAUSE_SECONDS)
    tmp = STATUS_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({s["id"]: s for s in statuses}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, STATUS_PATH)
    print_summary(statuses)
    return 0


if __name__ == "__main__":
    sys.exit(main())
