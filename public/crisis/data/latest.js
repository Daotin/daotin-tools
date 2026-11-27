window.CRISIS_DATA = {
  "generated_at": "2026-11-27T05:17:45+00:00",
  "as_of": "2026-11-27",
  "data_fetched_at": "2026-11-27T05:17:41+00:00",
  "level": {
    "level": "正常",
    "decided_by": [],
    "insufficient_nodes": [],
    "watch_unknown_nodes": []
  },
  "nodes": [
    {
      "id": "N1",
      "name": "美国风险累积",
      "summary": "美国股价估值、借钱炒股的规模、家庭还债压力是否同时处在自身历史的高位",
      "todo": [
        "存够 6 到 12 个月的家庭必要开支，放在随时能取出来的地方。",
        "不借钱投资，不买带杠杆的产品。",
        "列出信用卡分期、消费贷、网贷，从利率最高的开始还。"
      ],
      "main": [
        "1",
        "2",
        "3"
      ],
      "trigger_text": "3 项里至少 2 项偏高",
      "watch_text": "3 项里恰好 1 项偏高",
      "watch_unknown": false,
      "trials": null,
      "month_trigger_day": null,
      "prev_hint": null,
      "status": "watch",
      "label": "有苗头"
    },
    {
      "id": "N2",
      "name": "美国股市大幅下跌",
      "summary": "标普 500 从一年内最高点跌了多少",
      "todo": [
        "3 年内要用的钱不放进股市。",
        "已经在定投宽基指数的，大跌时不要恐慌卖出。",
        "不裸辞，跳槽先拿到新工作。"
      ],
      "main": [
        "5"
      ],
      "trigger_text": "跌幅达到 20%",
      "watch_text": "跌幅达到 10%、不到 20%",
      "watch_unknown": false,
      "trials": null,
      "month_trigger_day": null,
      "prev_hint": null,
      "status": "ok",
      "label": "未触发"
    },
    {
      "id": "N3",
      "name": "美国经济衰退",
      "summary": "美国失业率是否明显上升到通常意味着衰退的程度",
      "todo": [
        "弄清自己所在行业有多依赖出口和海外客户。",
        "补齐医疗险、重疾险、意外险，家里主要赚钱的人加一份定期寿险。",
        "大额消费和新增贷款先放一放。"
      ],
      "main": [
        "12"
      ],
      "trigger_text": "萨姆规则读数达到 0.5",
      "watch_text": "长短期利差、申领失业救济人数两项同时越线",
      "watch_unknown": false,
      "trials": null,
      "month_trigger_day": null,
      "prev_hint": null,
      "status": "ok",
      "label": "未触发"
    },
    {
      "id": "N4",
      "name": "中国出口走弱",
      "summary": "中国最近 3 个月出口额合计是否比去年同期少",
      "todo": [
        "在外贸、跨境电商、互联网、制造业工作的，先准备一项能带来收入的技能。",
        "更新简历，留意行业里的招聘和裁员消息。",
        "买了美股基金或 QDII 的，确认这笔钱 3 年内用不到。"
      ],
      "main": [
        "14"
      ],
      "trigger_text": "出口额三个月合计同比为负，以 1 月结尾的窗口不判断",
      "watch_text": "制造业 PMI 新出口订单越线",
      "watch_unknown": false,
      "trials": null,
      "month_trigger_day": null,
      "prev_hint": null,
      "status": "ok",
      "label": "未触发"
    },
    {
      "id": "N5",
      "name": "国内就业压力",
      "summary": "全国城镇调查失业率是否比去年同月明显上升",
      "todo": [
        "保住现有工作，不主动离职。",
        "把每月必要开支算清楚，砍掉可有可无的固定支出。",
        "保证房贷每月还得上。应急金存够以前，不提前还房贷。"
      ],
      "main": [
        "17"
      ],
      "trigger_text": "连续 2 个月比去年同月高出 0.5 个百分点以上",
      "watch_text": "最近 1 个月比去年同月高出 0.3 个百分点以上，但还没有触发",
      "watch_unknown": false,
      "trials": null,
      "month_trigger_day": null,
      "prev_hint": null,
      "status": "ok",
      "label": "未触发"
    },
    {
      "id": "N6",
      "name": "家庭收入与资产",
      "summary": "居民人均可支配收入扣除物价后，比上年同一累计期间是增是减",
      "todo": [
        "不听传言卖房，不把定期存款提前取出来，不大量囤货。",
        "不把全部积蓄换成黄金或美元。",
        "凡是承诺保本又承诺高收益的，一律不碰。"
      ],
      "main": [
        "19"
      ],
      "trigger_text": "实际累计同比为负",
      "watch_text": "实际累计同比比上年同期低 2 个百分点以上",
      "watch_unknown": false,
      "trials": null,
      "month_trigger_day": null,
      "prev_hint": null,
      "status": "ok",
      "label": "未触发"
    }
  ],
  "indicators": [
    {
      "id": "1",
      "node": "N1",
      "role": "main",
      "name": "席勒市盈率",
      "explain": "股价相对过去 10 年平均利润（扣除物价）贵不贵",
      "frequency": "monthly",
      "params": null,
      "rule_text": "处在自身历史最高的 20% 为偏高",
      "url": "https://shillerdata.com/",
      "unit": "倍",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 39.374477,
      "date": "2026-11-01",
      "level": "hit",
      "label": "偏高",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "2",
      "node": "N1",
      "role": "main",
      "name": "融资余额同比",
      "explain": "美国券商客户借钱买股票的总额，和去年同月比",
      "frequency": "monthly",
      "params": null,
      "rule_text": "处在自身历史最高的 20% 为偏高",
      "url": "https://www.finra.org/rules-guidance/key-topics/margin-accounts/margin-statistics",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 22.363461,
      "date": "2026-10-01",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "3",
      "node": "N1",
      "role": "main",
      "name": "家庭偿债支出占可支配收入的比例",
      "explain": "美国家庭每月拿多少比例的可支配收入还债",
      "frequency": "quarterly",
      "params": null,
      "rule_text": "处在自身历史最高的 20% 为偏高",
      "url": "https://fred.stlouisfed.org/series/TDSP",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 11.111439,
      "date": "2026-04-01",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "4",
      "node": "N1",
      "role": "display",
      "name": "美国 10 年期国债收益率",
      "explain": "美国政府借 10 年期的钱要付的年利率",
      "frequency": "daily",
      "params": null,
      "rule_text": "只展示",
      "url": "https://fred.stlouisfed.org/series/DGS10",
      "unit": "%",
      "decimals": 2,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 4.91,
      "date": "2026-11-24",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "5",
      "node": "N2",
      "role": "main",
      "name": "标普 500 从一年内最高点的跌幅",
      "explain": "美国 500 家大公司股价指数，比过去一年最高点跌了多少",
      "frequency": "daily",
      "params": null,
      "rule_text": "达到 10% 有苗头；达到 20% 触发",
      "url": "https://finance.yahoo.com/quote/%5EGSPC/history/",
      "unit": "点",
      "decimals": 0,
      "measure_text": "从一年内最高点下跌",
      "measure_unit": "%",
      "measure_decimals": 1,
      "cumulative": null,
      "value": 7182.779785,
      "date": "2026-11-25",
      "level": "ok",
      "label": "未触发",
      "missing_reason": null,
      "measure": 8.136029,
      "month_trigger_day": null,
      "fetch_failed": false
    },
    {
      "id": "6",
      "node": "N2",
      "role": "display",
      "name": "芝加哥联储金融状况指数",
      "explain": "美国借钱难不难的综合指数，0 是平均水平，高于 0 表示比平常紧",
      "frequency": "weekly",
      "params": null,
      "rule_text": "只展示，高于 0 时标出",
      "url": "https://fred.stlouisfed.org/series/NFCI",
      "unit": "",
      "decimals": 2,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": -0.444,
      "date": "2026-11-20",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "7",
      "node": "N2",
      "role": "display",
      "name": "恐慌指数 VIX",
      "explain": "市场预期标普 500 未来 30 天波动有多大，越高越紧张",
      "frequency": "daily",
      "params": null,
      "rule_text": "只展示",
      "url": "https://fred.stlouisfed.org/series/VIXCLS",
      "unit": "",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 26.36,
      "date": "2026-11-24",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "8",
      "node": "N2",
      "role": "display",
      "name": "企业债利差",
      "explain": "企业借钱比美国政府多付的年利率（穆迪 Baa 级企业债减 10 年期国债）",
      "frequency": "daily",
      "params": null,
      "rule_text": "只展示",
      "url": "https://fred.stlouisfed.org/series/BAA10Y",
      "unit": "个百分点",
      "decimals": 2,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 1.61,
      "date": "2026-11-24",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "9",
      "node": "N2",
      "role": "display",
      "name": "私人信贷基金限制赎回",
      "explain": "私人借贷基金是否限制投资人取回资金，来自新闻",
      "frequency": "irregular",
      "params": null,
      "rule_text": "只展示",
      "url": null,
      "unit": "",
      "decimals": null,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": null,
      "date": null,
      "level": null,
      "label": "数据不足（没有录入）",
      "missing_reason": "没有录入"
    },
    {
      "id": "10",
      "node": "N3",
      "role": "aux",
      "name": "长短期利差",
      "explain": "美国 10 年期国债利率减 3 个月期国债利率，小于 0 是反常情况",
      "frequency": "daily",
      "params": null,
      "rule_text": "小于 0 为越线",
      "url": "https://fred.stlouisfed.org/series/T10Y3M",
      "unit": "个百分点",
      "decimals": 2,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 0.51,
      "date": "2026-11-25",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "11",
      "node": "N3",
      "role": "aux",
      "name": "初次申领失业救济人数的四周平均值",
      "explain": "美国每周新申请失业救济的人数，取最近 4 周平均",
      "frequency": "weekly",
      "params": null,
      "rule_text": "比一年内最低点高 20% 为越线",
      "url": "https://fred.stlouisfed.org/series/ICSA",
      "unit": "人",
      "decimals": 0,
      "measure_text": "比一年内最低点高出",
      "measure_unit": "%",
      "measure_decimals": 1,
      "cumulative": null,
      "value": 196000.0,
      "date": "2026-11-21",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "measure": 0.384123,
      "fetch_failed": false
    },
    {
      "id": "12",
      "node": "N3",
      "role": "main",
      "name": "萨姆规则读数",
      "explain": "美国失业率三个月平均比过去 12 个月里三个月平均的最低点高出多少个百分点",
      "frequency": "monthly",
      "params": null,
      "rule_text": "达到 0.5 触发",
      "url": "https://fred.stlouisfed.org/series/SAHMREALTIME",
      "unit": "个百分点",
      "decimals": 2,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 0.0,
      "date": "2026-10-01",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "13",
      "node": "N3",
      "role": "display",
      "name": "外部机构的衰退概率",
      "explain": "外部机构估计的美国衰退概率，人工录入，不参与判断",
      "frequency": "irregular",
      "params": null,
      "rule_text": "只展示",
      "url": null,
      "unit": "%",
      "decimals": 0,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": null,
      "date": null,
      "level": null,
      "label": "数据不足（没有录入）",
      "missing_reason": "没有录入"
    },
    {
      "id": "14",
      "node": "N4",
      "role": "main",
      "name": "出口额三个月合计同比",
      "explain": "中国最近 3 个月出口额合计，和去年同样 3 个月比",
      "frequency": "monthly",
      "params": null,
      "rule_text": "为负触发；以 1 月结尾的窗口不判断",
      "url": "https://data.eastmoney.com/cjsj/hgjck.html",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 31.936086,
      "date": "2026-10-01",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "15",
      "node": "N4",
      "role": "display",
      "name": "单月出口额同比",
      "explain": "中国当月出口额（美元），和去年同月比",
      "frequency": "monthly",
      "params": null,
      "rule_text": "只作解释",
      "url": "https://fred.stlouisfed.org/series/XTEXVA01CNM667N",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 35.03388,
      "date": "2026-10-01",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "16",
      "node": "N4",
      "role": "aux",
      "name": "制造业 PMI 新出口订单指数",
      "explain": "对制造企业的月度问卷里，出口订单比上月多还是少，50 以上表示变多",
      "frequency": "monthly",
      "params": null,
      "rule_text": "处在自身历史最低的 20% 为越线",
      "url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/monthData",
      "unit": "",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 48.7,
      "date": "2026-10-01",
      "level": "ok",
      "label": "未越线",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "17",
      "node": "N5",
      "role": "main",
      "name": "城镇调查失业率和去年同月的差",
      "explain": "全国城镇调查失业率减去年同月的值，单位是百分点",
      "frequency": "monthly",
      "params": null,
      "rule_text": "连续 2 个月高出 0.5 个百分点触发；最近 1 个月高出 0.3 个百分点有苗头",
      "url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/monthData",
      "unit": "个百分点",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 0.0,
      "date": "2026-10-01",
      "level": "ok",
      "label": "未触发",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "18",
      "node": "N5",
      "role": "display",
      "name": "制造业 PMI 从业人员指数",
      "explain": "对制造企业的月度问卷里，员工人数比上月多还是少，50 以上表示变多",
      "frequency": "monthly",
      "params": null,
      "rule_text": "只展示",
      "url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/monthData",
      "unit": "",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 48.4,
      "date": "2026-10-01",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "19",
      "node": "N6",
      "role": "main",
      "name": "居民人均可支配收入实际累计同比",
      "explain": "全国居民人均可支配收入扣除物价后，从 1 月累计到本季度末，和上年同期比",
      "frequency": "quarterly",
      "params": null,
      "rule_text": "比上年同期低 2 个百分点有苗头；为负触发",
      "url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/quarterData",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": true,
      "value": 4.4,
      "date": "2026-07-01",
      "level": "ok",
      "label": "未触发",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "20",
      "node": "N6",
      "role": "display",
      "name": "房价同比",
      "explain": "所选城市新房（或二手房）价格和去年同月比的涨跌百分比",
      "frequency": "monthly",
      "params": {
        "city": "南京",
        "house_type": "二手住宅"
      },
      "rule_text": "为负显示“下跌”",
      "url": "https://data.eastmoney.com/cjsj/newhouse.html",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": -3.6,
      "date": "2026-10-01",
      "level": null,
      "label": "下跌",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "21",
      "node": "N6",
      "role": "display",
      "name": "沪深 300 比一年前的涨跌",
      "explain": "沪深两市 300 只大盘股的价格指数，和 252 个交易日前比的涨跌百分比",
      "frequency": "daily",
      "params": null,
      "rule_text": "为负显示“下跌”",
      "url": "https://finance.sina.com.cn/realstock/company/sh000300/nc.shtml",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": -16.043365,
      "date": "2026-11-26",
      "level": null,
      "label": "下跌",
      "missing_reason": null,
      "fetch_failed": false
    },
    {
      "id": "22",
      "node": "N6",
      "role": "display",
      "name": "工商银行人民币一年期整存整取挂牌利率",
      "explain": "工商银行一年期定期存款的年利率，和约一年前录入的值比较",
      "frequency": "irregular",
      "params": null,
      "rule_text": "比约一年前录入的值低，显示“下降”",
      "url": null,
      "unit": "%",
      "decimals": 2,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": null,
      "date": null,
      "level": null,
      "label": "数据不足（没有录入）",
      "missing_reason": "没有录入"
    },
    {
      "id": "23",
      "node": "N6",
      "role": "display",
      "name": "物价（CPI）同比",
      "explain": "全国居民消费价格和去年同月比的涨跌百分比",
      "frequency": "monthly",
      "params": null,
      "rule_text": "只展示",
      "url": "https://data.eastmoney.com/cjsj/cpi.html",
      "unit": "%",
      "decimals": 1,
      "measure_text": null,
      "measure_unit": null,
      "measure_decimals": null,
      "cumulative": null,
      "value": 0.7,
      "date": "2026-10-01",
      "level": null,
      "label": null,
      "missing_reason": null,
      "fetch_failed": false
    }
  ],
  "reference_series": [
    {
      "id": "USREC",
      "name": "美国国家经济研究局认定的衰退月份（1 为衰退）",
      "url": "https://fred.stlouisfed.org/series/USREC"
    }
  ],
  "fetch_failures": [],
  "warnings": [],
  "backtest": {
    "as_of": "2026-11-27",
    "nodes": [
      {
        "id": "N1",
        "name": "美国风险累积",
        "main": [
          "1",
          "2",
          "3"
        ],
        "rule": "3 项里至少 2 项偏高",
        "data_start": "1881-01-01",
        "judged_start": "2004-04",
        "judged_end": "2026-09",
        "rounds": [
          {
            "start": "2004-04",
            "visible": "2004-05-25",
            "end": "2007-10",
            "close": "2009-02",
            "unknown_start": true
          },
          {
            "start": "2010-03",
            "visible": "2010-06-29",
            "end": "2010-04",
            "close": "2010-10",
            "unknown_start": false
          },
          {
            "start": "2011-02",
            "visible": "2011-06-29",
            "end": "2011-05",
            "close": "2011-11",
            "unknown_start": false
          },
          {
            "start": "2013-07",
            "visible": "2013-12-29",
            "end": "2013-12",
            "close": "2014-06",
            "unknown_start": false
          },
          {
            "start": "2020-11",
            "visible": "2021-03-31",
            "end": "2021-10",
            "close": "2022-04",
            "unknown_start": false
          },
          {
            "start": "2024-10",
            "visible": "2025-03-31",
            "end": "2025-01",
            "close": "2025-07",
            "unknown_start": false
          },
          {
            "start": "2025-08",
            "visible": "2025-12-29",
            "end": "2026-09",
            "close": null,
            "unknown_start": false
          }
        ],
        "round_count": 7,
        "unknown_start_count": 1
      },
      {
        "id": "N2",
        "name": "美国股市大幅下跌",
        "main": [
          "5"
        ],
        "rule": "跌幅达到 20%",
        "data_start": "1927-12-30",
        "judged_start": "1929-01",
        "judged_end": "2026-11",
        "rounds": [
          {
            "start": "1929-10",
            "visible": "1929-10-29",
            "end": "1935-04",
            "close": "1935-10",
            "unknown_start": false
          },
          {
            "start": "1937-09",
            "visible": "1937-09-08",
            "end": "1939-08",
            "close": "1940-02",
            "unknown_start": false
          },
          {
            "start": "1940-05",
            "visible": "1940-05-15",
            "end": "1941-05",
            "close": "1941-11",
            "unknown_start": false
          },
          {
            "start": "1941-12",
            "visible": "1941-12-10",
            "end": "1942-07",
            "close": "1943-01",
            "unknown_start": false
          },
          {
            "start": "1946-09",
            "visible": "1946-09-04",
            "end": "1947-06",
            "close": "1947-12",
            "unknown_start": false
          },
          {
            "start": "1949-06",
            "visible": "1949-06-14",
            "end": "1949-06",
            "close": "1949-12",
            "unknown_start": false
          },
          {
            "start": "1957-10",
            "visible": "1957-10-22",
            "end": "1957-10",
            "close": "1958-04",
            "unknown_start": false
          },
          {
            "start": "1962-05",
            "visible": "1962-05-29",
            "end": "1962-11",
            "close": "1963-05",
            "unknown_start": false
          },
          {
            "start": "1966-08",
            "visible": "1966-08-30",
            "end": "1966-10",
            "close": "1967-04",
            "unknown_start": false
          },
          {
            "start": "1970-04",
            "visible": "1970-04-23",
            "end": "1970-08",
            "close": "1971-02",
            "unknown_start": false
          },
          {
            "start": "1973-11",
            "visible": "1973-11-28",
            "end": "1975-02",
            "close": "1975-08",
            "unknown_start": false
          },
          {
            "start": "1982-03",
            "visible": "1982-03-06",
            "end": "1982-08",
            "close": "1983-02",
            "unknown_start": false
          },
          {
            "start": "1987-10",
            "visible": "1987-10-20",
            "end": "1988-09",
            "close": "1989-03",
            "unknown_start": false
          },
          {
            "start": "2001-03",
            "visible": "2001-03-13",
            "end": "2003-04",
            "close": "2003-10",
            "unknown_start": false
          },
          {
            "start": "2008-07",
            "visible": "2008-07-10",
            "end": "2009-09",
            "close": "2010-03",
            "unknown_start": false
          },
          {
            "start": "2020-03",
            "visible": "2020-03-13",
            "end": "2020-04",
            "close": "2020-10",
            "unknown_start": false
          },
          {
            "start": "2022-06",
            "visible": "2022-06-14",
            "end": "2023-01",
            "close": "2023-07",
            "unknown_start": false
          }
        ],
        "round_count": 17,
        "unknown_start_count": 0
      },
      {
        "id": "N3",
        "name": "美国经济衰退",
        "main": [
          "12"
        ],
        "rule": "萨姆规则读数达到 0.5",
        "data_start": "1959-12-01",
        "judged_start": "1959-12",
        "judged_end": "2026-10",
        "event_source": "USREC",
        "events": [
          {
            "start": "1854-12",
            "visible": "1854-12-31",
            "end": "1854-12",
            "close": "1855-01",
            "unknown_start": true
          },
          {
            "start": "1857-07",
            "visible": "1857-07-31",
            "end": "1858-12",
            "close": "1859-01",
            "unknown_start": false
          },
          {
            "start": "1860-11",
            "visible": "1860-11-30",
            "end": "1861-06",
            "close": "1861-07",
            "unknown_start": false
          },
          {
            "start": "1865-05",
            "visible": "1865-05-31",
            "end": "1867-12",
            "close": "1868-01",
            "unknown_start": false
          },
          {
            "start": "1869-07",
            "visible": "1869-07-31",
            "end": "1870-12",
            "close": "1871-01",
            "unknown_start": false
          },
          {
            "start": "1873-11",
            "visible": "1873-11-30",
            "end": "1879-03",
            "close": "1879-04",
            "unknown_start": false
          },
          {
            "start": "1882-04",
            "visible": "1882-04-30",
            "end": "1885-05",
            "close": "1885-06",
            "unknown_start": false
          },
          {
            "start": "1887-04",
            "visible": "1887-04-30",
            "end": "1888-04",
            "close": "1888-05",
            "unknown_start": false
          },
          {
            "start": "1890-08",
            "visible": "1890-08-31",
            "end": "1891-05",
            "close": "1891-06",
            "unknown_start": false
          },
          {
            "start": "1893-02",
            "visible": "1893-02-28",
            "end": "1894-06",
            "close": "1894-07",
            "unknown_start": false
          },
          {
            "start": "1896-01",
            "visible": "1896-01-31",
            "end": "1897-06",
            "close": "1897-07",
            "unknown_start": false
          },
          {
            "start": "1899-07",
            "visible": "1899-07-31",
            "end": "1900-12",
            "close": "1901-01",
            "unknown_start": false
          },
          {
            "start": "1902-10",
            "visible": "1902-10-31",
            "end": "1904-08",
            "close": "1904-09",
            "unknown_start": false
          },
          {
            "start": "1907-06",
            "visible": "1907-06-30",
            "end": "1908-06",
            "close": "1908-07",
            "unknown_start": false
          },
          {
            "start": "1910-02",
            "visible": "1910-02-28",
            "end": "1912-01",
            "close": "1912-02",
            "unknown_start": false
          },
          {
            "start": "1913-02",
            "visible": "1913-02-28",
            "end": "1914-12",
            "close": "1915-01",
            "unknown_start": false
          },
          {
            "start": "1918-09",
            "visible": "1918-09-30",
            "end": "1919-03",
            "close": "1919-04",
            "unknown_start": false
          },
          {
            "start": "1920-02",
            "visible": "1920-02-29",
            "end": "1921-07",
            "close": "1921-08",
            "unknown_start": false
          },
          {
            "start": "1923-06",
            "visible": "1923-06-30",
            "end": "1924-07",
            "close": "1924-08",
            "unknown_start": false
          },
          {
            "start": "1926-11",
            "visible": "1926-11-30",
            "end": "1927-11",
            "close": "1927-12",
            "unknown_start": false
          },
          {
            "start": "1929-09",
            "visible": "1929-09-30",
            "end": "1933-03",
            "close": "1933-04",
            "unknown_start": false
          },
          {
            "start": "1937-06",
            "visible": "1937-06-30",
            "end": "1938-06",
            "close": "1938-07",
            "unknown_start": false
          },
          {
            "start": "1945-03",
            "visible": "1945-03-31",
            "end": "1945-10",
            "close": "1945-11",
            "unknown_start": false
          },
          {
            "start": "1948-12",
            "visible": "1948-12-31",
            "end": "1949-10",
            "close": "1949-11",
            "unknown_start": false
          },
          {
            "start": "1953-08",
            "visible": "1953-08-31",
            "end": "1954-05",
            "close": "1954-06",
            "unknown_start": false
          },
          {
            "start": "1957-09",
            "visible": "1957-09-30",
            "end": "1958-04",
            "close": "1958-05",
            "unknown_start": false
          },
          {
            "start": "1960-05",
            "visible": "1960-05-31",
            "end": "1961-02",
            "close": "1961-03",
            "unknown_start": false
          },
          {
            "start": "1970-01",
            "visible": "1970-01-31",
            "end": "1970-11",
            "close": "1970-12",
            "unknown_start": false
          },
          {
            "start": "1973-12",
            "visible": "1973-12-31",
            "end": "1975-03",
            "close": "1975-04",
            "unknown_start": false
          },
          {
            "start": "1980-02",
            "visible": "1980-02-29",
            "end": "1980-07",
            "close": "1980-08",
            "unknown_start": false
          },
          {
            "start": "1981-08",
            "visible": "1981-08-31",
            "end": "1982-11",
            "close": "1982-12",
            "unknown_start": false
          },
          {
            "start": "1990-08",
            "visible": "1990-08-31",
            "end": "1991-03",
            "close": "1991-04",
            "unknown_start": false
          },
          {
            "start": "2001-04",
            "visible": "2001-04-30",
            "end": "2001-11",
            "close": "2001-12",
            "unknown_start": false
          },
          {
            "start": "2008-01",
            "visible": "2008-01-31",
            "end": "2009-06",
            "close": "2009-07",
            "unknown_start": false
          },
          {
            "start": "2020-03",
            "visible": "2020-03-31",
            "end": "2020-04",
            "close": "2020-05",
            "unknown_start": false
          }
        ],
        "summary": {
          "提前命中": 1,
          "同期或滞后确认": 8,
          "误报": 2,
          "待观察": 0,
          "起点未知": 1
        },
        "rounds": [
          {
            "start": "1959-12",
            "visible": "1960-01-10",
            "end": "1960-01",
            "close": "1960-07",
            "unknown_start": true,
            "category": null,
            "in_recession": false
          },
          {
            "start": "1960-08",
            "visible": "1960-09-10",
            "end": "1961-11",
            "close": "1962-05",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1960-05",
            "lag_months": 4,
            "in_recession": true
          },
          {
            "start": "1969-10",
            "visible": "1969-11-10",
            "end": "1971-10",
            "close": "1972-04",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1970-01",
            "lead_months": 2,
            "in_recession": false
          },
          {
            "start": "1974-03",
            "visible": "1974-04-10",
            "end": "1976-01",
            "close": "1976-07",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1973-12",
            "lag_months": 4,
            "in_recession": true
          },
          {
            "start": "1976-11",
            "visible": "1976-12-10",
            "end": "1976-11",
            "close": "1977-05",
            "unknown_start": false,
            "category": "误报",
            "in_recession": false
          },
          {
            "start": "1980-04",
            "visible": "1980-05-10",
            "end": "1981-04",
            "close": "1981-10",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1980-02",
            "lag_months": 3,
            "in_recession": true
          },
          {
            "start": "1981-11",
            "visible": "1981-12-10",
            "end": "1983-06",
            "close": "1983-12",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1981-08",
            "lag_months": 4,
            "in_recession": true
          },
          {
            "start": "1990-11",
            "visible": "1990-12-10",
            "end": "1992-11",
            "close": "1993-05",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1990-08",
            "lag_months": 4,
            "in_recession": true
          },
          {
            "start": "2001-06",
            "visible": "2001-07-10",
            "end": "2002-10",
            "close": "2003-04",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2001-04",
            "lag_months": 3,
            "in_recession": true
          },
          {
            "start": "2008-04",
            "visible": "2008-05-10",
            "end": "2010-05",
            "close": "2010-11",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2008-01",
            "lag_months": 4,
            "in_recession": true
          },
          {
            "start": "2020-04",
            "visible": "2020-05-10",
            "end": "2021-03",
            "close": "2021-09",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2020-03",
            "lag_months": 2,
            "in_recession": true
          },
          {
            "start": "2024-07",
            "visible": "2024-08-10",
            "end": "2024-09",
            "close": "2025-03",
            "unknown_start": false,
            "category": "误报",
            "in_recession": false
          }
        ],
        "round_count": 12,
        "unknown_start_count": 1
      },
      {
        "id": "N4",
        "name": "中国出口走弱",
        "main": [
          "14"
        ],
        "rule": "出口额三个月合计同比为负，以 1 月结尾的窗口不判断",
        "data_start": "1993-03-01",
        "judged_start": "1993-03",
        "judged_end": "2026-10",
        "rounds": [
          {
            "start": "1993-08",
            "visible": "1993-09-20",
            "end": "1993-08",
            "close": "1994-03",
            "unknown_start": false
          },
          {
            "start": "1996-02",
            "visible": "1996-03-20",
            "end": "1996-08",
            "close": "1997-03",
            "unknown_start": false
          },
          {
            "start": "1998-09",
            "visible": "1998-10-20",
            "end": "1999-06",
            "close": "1999-12",
            "unknown_start": false
          },
          {
            "start": "2009-02",
            "visible": "2009-03-20",
            "end": "2009-11",
            "close": "2010-06",
            "unknown_start": false
          },
          {
            "start": "2014-03",
            "visible": "2014-04-20",
            "end": "2014-04",
            "close": "2014-10",
            "unknown_start": false
          },
          {
            "start": "2015-05",
            "visible": "2015-06-20",
            "end": "2017-02",
            "close": "2017-08",
            "unknown_start": false
          },
          {
            "start": "2019-02",
            "visible": "2019-03-20",
            "end": "2020-06",
            "close": "2020-12",
            "unknown_start": false
          },
          {
            "start": "2022-11",
            "visible": "2022-12-20",
            "end": "2024-05",
            "close": "2024-11",
            "unknown_start": false
          }
        ],
        "round_count": 8,
        "unknown_start_count": 0
      },
      {
        "id": "N5",
        "name": "国内就业压力",
        "main": [
          "17"
        ],
        "rule": "连续 2 个月比去年同月高出 0.5 个百分点以上",
        "data_start": "2019-01-01",
        "judged_start": "2019-01",
        "judged_end": "2026-10",
        "rounds": [
          {
            "start": "2020-03",
            "visible": "2020-04-20",
            "end": "2020-06",
            "close": "2020-12",
            "unknown_start": false
          },
          {
            "start": "2022-04",
            "visible": "2022-05-20",
            "end": "2022-11",
            "close": "2023-05",
            "unknown_start": false
          }
        ],
        "round_count": 2,
        "unknown_start_count": 0
      },
      {
        "id": "N6",
        "name": "家庭收入与资产",
        "main": [
          "19"
        ],
        "rule": "实际累计同比为负",
        "data_start": "2014-01-01",
        "judged_start": "2015-01",
        "judged_end": "2026-07",
        "rounds": [
          {
            "start": "2020-01",
            "visible": "2020-04-25",
            "end": "2020-04",
            "close": "2020-10",
            "unknown_start": false
          }
        ],
        "round_count": 1,
        "unknown_start_count": 0
      }
    ],
    "signals": [
      {
        "node": "N1",
        "kind": "indicator",
        "indicator": "1",
        "name": "1 席勒市盈率 偏高",
        "against": "N2",
        "window_months": 24,
        "judged_start": "1886-01",
        "rounds": [
          {
            "start": "1886-01",
            "visible": "1886-02-10",
            "end": "1887-05",
            "close": "1887-11",
            "unknown_start": true,
            "category": null
          },
          {
            "start": "1889-09",
            "visible": "1889-10-10",
            "end": "1889-09",
            "close": "1890-03",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1890-05",
            "visible": "1890-06-10",
            "end": "1890-07",
            "close": "1891-01",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1891-09",
            "visible": "1891-10-10",
            "end": "1892-12",
            "close": "1893-06",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1895-08",
            "visible": "1895-09-10",
            "end": "1895-10",
            "close": "1896-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1896-05",
            "visible": "1896-06-10",
            "end": "1896-06",
            "close": "1896-12",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1897-06",
            "visible": "1897-07-10",
            "end": "1900-04",
            "close": "1900-10",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1900-11",
            "visible": "1900-12-10",
            "end": "1903-03",
            "close": "1903-09",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1905-02",
            "visible": "1905-03-10",
            "end": "1906-02",
            "close": "1906-08",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1927-11",
            "visible": "1927-12-10",
            "end": "1930-09",
            "close": "1931-03",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1929-10",
            "lead_months": 22
          },
          {
            "start": "1936-03",
            "visible": "1936-04-10",
            "end": "1937-08",
            "close": "1938-02",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1937-09",
            "lead_months": 17
          },
          {
            "start": "1955-07",
            "visible": "1955-08-10",
            "end": "1956-08",
            "close": "1957-02",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1959-03",
            "visible": "1959-04-10",
            "end": "1960-01",
            "close": "1960-07",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1961-01",
            "visible": "1961-02-10",
            "end": "1962-05",
            "close": "1962-11",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1962-05",
            "lead_months": 15
          },
          {
            "start": "1962-12",
            "visible": "1963-01-10",
            "end": "1969-06",
            "close": "1969-12",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1962-05",
            "lag_months": 8
          },
          {
            "start": "1991-08",
            "visible": "1991-09-10",
            "end": "2008-08",
            "close": "2009-02",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2010-03",
            "visible": "2010-04-10",
            "end": "2026-11",
            "close": null,
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 3,
          "同期或滞后确认": 1,
          "误报": 12,
          "待观察": 0,
          "起点未知": 1
        }
      },
      {
        "node": "N1",
        "kind": "indicator",
        "indicator": "2",
        "name": "2 融资余额同比 偏高",
        "against": "N2",
        "window_months": 24,
        "judged_start": "2003-01",
        "rounds": [
          {
            "start": "2004-04",
            "visible": "2004-05-25",
            "end": "2004-04",
            "close": "2004-10",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2007-05",
            "visible": "2007-06-25",
            "end": "2007-10",
            "close": "2008-04",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2008-07",
            "lead_months": 13
          },
          {
            "start": "2010-02",
            "visible": "2010-03-25",
            "end": "2010-04",
            "close": "2010-10",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2008-07",
            "lag_months": 20
          },
          {
            "start": "2011-02",
            "visible": "2011-03-25",
            "end": "2011-05",
            "close": "2011-11",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2013-07",
            "visible": "2013-08-25",
            "end": "2013-12",
            "close": "2014-06",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2020-11",
            "visible": "2020-12-25",
            "end": "2021-10",
            "close": "2022-04",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2022-06",
            "lead_months": 18
          },
          {
            "start": "2024-10",
            "visible": "2024-11-25",
            "end": "2025-01",
            "close": "2025-07",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2025-08",
            "visible": "2025-09-25",
            "end": "2026-09",
            "close": null,
            "unknown_start": false,
            "category": "待观察"
          }
        ],
        "summary": {
          "提前命中": 2,
          "同期或滞后确认": 1,
          "误报": 4,
          "待观察": 1,
          "起点未知": 0
        }
      },
      {
        "node": "N1",
        "kind": "indicator",
        "indicator": "3",
        "name": "3 家庭偿债支出占可支配收入的比例 偏高",
        "against": "N2",
        "window_months": 24,
        "judged_start": "2010-01",
        "rounds": [],
        "summary": {
          "提前命中": 0,
          "同期或滞后确认": 0,
          "误报": 0,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N1",
        "kind": "trigger",
        "indicator": null,
        "name": "N1“已出现”：3 项里至少 2 项偏高",
        "against": "N2",
        "window_months": 24,
        "judged_start": "2004-04",
        "rounds": [
          {
            "start": "2004-04",
            "visible": "2004-05-25",
            "end": "2007-10",
            "close": "2009-02",
            "unknown_start": true,
            "category": null
          },
          {
            "start": "2010-03",
            "visible": "2010-06-29",
            "end": "2010-04",
            "close": "2010-10",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2011-02",
            "visible": "2011-06-29",
            "end": "2011-05",
            "close": "2011-11",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2013-07",
            "visible": "2013-12-29",
            "end": "2013-12",
            "close": "2014-06",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2020-11",
            "visible": "2021-03-31",
            "end": "2021-10",
            "close": "2022-04",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2022-06",
            "lead_months": 15
          },
          {
            "start": "2024-10",
            "visible": "2025-03-31",
            "end": "2025-01",
            "close": "2025-07",
            "unknown_start": false,
            "category": "待观察"
          },
          {
            "start": "2025-08",
            "visible": "2025-12-29",
            "end": "2026-09",
            "close": null,
            "unknown_start": false,
            "category": "待观察"
          }
        ],
        "summary": {
          "提前命中": 1,
          "同期或滞后确认": 0,
          "误报": 3,
          "待观察": 2,
          "起点未知": 1
        }
      },
      {
        "node": "N2",
        "kind": "watch",
        "indicator": null,
        "name": "N2“有苗头”：跌幅达到 10%、不到 20%",
        "against": "N2",
        "window_months": 12,
        "judged_start": "1929-01",
        "rounds": [
          {
            "start": "1933-05",
            "visible": "1933-05-09",
            "end": "1934-04",
            "close": "1934-10",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1929-10",
            "lag_months": 43
          },
          {
            "start": "1935-05",
            "visible": "1935-05-02",
            "end": "1935-05",
            "close": "1935-11",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1929-10",
            "lag_months": 67
          },
          {
            "start": "1936-04",
            "visible": "1936-04-29",
            "end": "1936-05",
            "close": "1936-11",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1937-04",
            "visible": "1937-04-27",
            "end": "1937-08",
            "close": "1938-02",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1937-09",
            "lead_months": 5
          },
          {
            "start": "1938-11",
            "visible": "1938-11-29",
            "end": "1939-02",
            "close": "1939-08",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1937-09",
            "lag_months": 14
          },
          {
            "start": "1939-09",
            "visible": "1939-09-02",
            "end": "1939-09",
            "close": "1940-03",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1937-09",
            "lag_months": 24
          },
          {
            "start": "1940-11",
            "visible": "1940-11-02",
            "end": "1942-10",
            "close": "1943-04",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1940-05",
            "lag_months": 6
          },
          {
            "start": "1943-11",
            "visible": "1943-11-09",
            "end": "1943-12",
            "close": "1944-06",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1946-02",
            "visible": "1946-02-27",
            "end": "1946-08",
            "close": "1947-02",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1946-09",
            "lead_months": 7
          },
          {
            "start": "1947-07",
            "visible": "1947-07-02",
            "end": "1949-07",
            "close": "1950-01",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1946-09",
            "lag_months": 10
          },
          {
            "start": "1950-06",
            "visible": "1950-06-30",
            "end": "1950-07",
            "close": "1951-01",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1953-06",
            "visible": "1953-06-10",
            "end": "1953-10",
            "close": "1954-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1955-10",
            "visible": "1955-10-12",
            "end": "1955-10",
            "close": "1956-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1956-11",
            "visible": "1956-11-22",
            "end": "1958-05",
            "close": "1958-11",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1957-10",
            "lead_months": 11
          },
          {
            "start": "1960-03",
            "visible": "1960-03-05",
            "end": "1960-11",
            "close": "1961-05",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1962-04",
            "visible": "1962-05-01",
            "end": "1962-04",
            "close": "1962-10",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1962-05",
            "lag_months": 0
          },
          {
            "start": "1962-12",
            "visible": "1962-12-04",
            "end": "1963-01",
            "close": "1963-07",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1962-05",
            "lag_months": 7
          },
          {
            "start": "1966-05",
            "visible": "1966-05-17",
            "end": "1967-01",
            "close": "1967-07",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1966-08",
            "lead_months": 3
          },
          {
            "start": "1968-03",
            "visible": "1968-03-06",
            "end": "1968-03",
            "close": "1968-09",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1969-06",
            "visible": "1969-06-20",
            "end": "1970-11",
            "close": "1971-05",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1970-04",
            "lead_months": 10
          },
          {
            "start": "1971-08",
            "visible": "1971-08-05",
            "end": "1971-11",
            "close": "1972-05",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1973-04",
            "visible": "1973-04-28",
            "end": "1974-04",
            "close": "1974-10",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1973-11",
            "lead_months": 7
          },
          {
            "start": "1975-03",
            "visible": "1975-03-04",
            "end": "1975-10",
            "close": "1976-04",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1973-11",
            "lag_months": 16
          },
          {
            "start": "1977-05",
            "visible": "1977-05-26",
            "end": "1979-02",
            "close": "1979-08",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1979-10",
            "visible": "1979-10-26",
            "end": "1980-05",
            "close": "1980-11",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1981-08",
            "visible": "1981-08-25",
            "end": "1982-07",
            "close": "1983-01",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1982-03",
            "lead_months": 7
          },
          {
            "start": "1984-02",
            "visible": "1984-02-14",
            "end": "1984-08",
            "close": "1985-02",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1988-10",
            "visible": "1988-10-04",
            "end": "1988-10",
            "close": "1989-04",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1987-10",
            "lag_months": 12
          },
          {
            "start": "1990-01",
            "visible": "1990-01-31",
            "end": "1990-01",
            "close": "1990-07",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1990-08",
            "visible": "1990-08-18",
            "end": "1991-01",
            "close": "1991-07",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1997-10",
            "visible": "1997-10-28",
            "end": "1997-10",
            "close": "1998-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1998-08",
            "visible": "1998-08-15",
            "end": "1998-10",
            "close": "1999-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1999-09",
            "visible": "1999-09-30",
            "end": "2001-05",
            "close": "2001-11",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2001-12",
            "visible": "2001-12-04",
            "end": "2002-04",
            "close": "2002-10",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2001-03",
            "lag_months": 9
          },
          {
            "start": "2003-05",
            "visible": "2003-05-02",
            "end": "2003-05",
            "close": "2003-11",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2001-03",
            "lag_months": 26
          },
          {
            "start": "2007-11",
            "visible": "2007-11-27",
            "end": "2008-06",
            "close": "2008-12",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2008-07",
            "lead_months": 8
          },
          {
            "start": "2010-05",
            "visible": "2010-05-21",
            "end": "2010-09",
            "close": "2011-03",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2011-08",
            "visible": "2011-08-05",
            "end": "2011-12",
            "close": "2012-06",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2015-08",
            "visible": "2015-08-25",
            "end": "2016-02",
            "close": "2016-08",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2018-02",
            "visible": "2018-02-09",
            "end": "2018-04",
            "close": "2018-10",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2018-11",
            "visible": "2018-11-24",
            "end": "2019-01",
            "close": "2019-07",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2020-02",
            "visible": "2020-02-28",
            "end": "2020-06",
            "close": "2020-12",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2020-03",
            "lead_months": 1
          },
          {
            "start": "2022-02",
            "visible": "2022-02-23",
            "end": "2023-10",
            "close": "2024-04",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2022-06",
            "lead_months": 4
          },
          {
            "start": "2025-03",
            "visible": "2025-03-14",
            "end": "2025-04",
            "close": "2025-10",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2026-11",
            "visible": "2026-11-21",
            "end": "2026-11",
            "close": null,
            "unknown_start": false,
            "category": "待观察"
          }
        ],
        "summary": {
          "提前命中": 10,
          "同期或滞后确认": 12,
          "误报": 22,
          "待观察": 1,
          "起点未知": 0
        }
      },
      {
        "node": "N3",
        "kind": "indicator",
        "indicator": "10",
        "name": "10 长短期利差 越线",
        "against": "N3",
        "window_months": 24,
        "judged_start": "1982-01",
        "rounds": [
          {
            "start": "1982-02",
            "visible": "1982-02-02",
            "end": "1982-02",
            "close": "1982-08",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1981-08",
            "lag_months": 6
          },
          {
            "start": "1989-03",
            "visible": "1989-03-28",
            "end": "1989-12",
            "close": "1990-06",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1990-08",
            "lead_months": 17
          },
          {
            "start": "1998-09",
            "visible": "1998-09-11",
            "end": "1998-10",
            "close": "1999-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2000-04",
            "visible": "2000-04-08",
            "end": "2001-02",
            "close": "2001-08",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2001-04",
            "lead_months": 12
          },
          {
            "start": "2006-01",
            "visible": "2006-01-18",
            "end": "2007-08",
            "close": "2008-02",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2008-01",
            "lead_months": 24
          },
          {
            "start": "2019-03",
            "visible": "2019-03-23",
            "end": "2020-03",
            "close": "2020-09",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2020-03",
            "lead_months": 12
          },
          {
            "start": "2022-10",
            "visible": "2022-10-19",
            "end": "2025-10",
            "close": "2026-04",
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 4,
          "同期或滞后确认": 1,
          "误报": 2,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N3",
        "kind": "indicator",
        "indicator": "11",
        "name": "11 初次申领失业救济人数的四周平均值 越线",
        "against": "N3",
        "window_months": 12,
        "judged_start": "1968-01",
        "rounds": [
          {
            "start": "1969-12",
            "visible": "1970-01-03",
            "end": "1971-01",
            "close": "1971-07",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1970-01",
            "lag_months": 0
          },
          {
            "start": "1972-07",
            "visible": "1972-07-22",
            "end": "1972-07",
            "close": "1973-01",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1973-12",
            "visible": "1973-12-29",
            "end": "1975-09",
            "close": "1976-03",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1973-12",
            "lag_months": 0
          },
          {
            "start": "1977-02",
            "visible": "1977-02-12",
            "end": "1977-02",
            "close": "1977-08",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1979-04",
            "visible": "1979-04-14",
            "end": "1980-09",
            "close": "1981-03",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1980-02",
            "lead_months": 10
          },
          {
            "start": "1981-10",
            "visible": "1981-10-17",
            "end": "1982-11",
            "close": "1983-05",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1981-08",
            "lag_months": 2
          },
          {
            "start": "1984-10",
            "visible": "1984-10-27",
            "end": "1984-11",
            "close": "1985-05",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "1989-10",
            "visible": "1989-10-14",
            "end": "1990-02",
            "close": "1990-08",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1990-08",
            "lead_months": 10
          },
          {
            "start": "1990-10",
            "visible": "1990-10-20",
            "end": "1991-06",
            "close": "1991-12",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "1990-08",
            "lag_months": 2
          },
          {
            "start": "2000-11",
            "visible": "2000-11-25",
            "end": "2002-01",
            "close": "2002-07",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2001-04",
            "lead_months": 5
          },
          {
            "start": "2005-09",
            "visible": "2005-10-01",
            "end": "2005-10",
            "close": "2006-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2008-03",
            "visible": "2008-04-05",
            "end": "2009-09",
            "close": "2010-03",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2008-01",
            "lag_months": 3
          },
          {
            "start": "2017-09",
            "visible": "2017-09-30",
            "end": "2017-09",
            "close": "2018-03",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2020-03",
            "visible": "2020-03-28",
            "end": "2021-03",
            "close": "2021-09",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2020-03",
            "lag_months": 0
          },
          {
            "start": "2023-06",
            "visible": "2023-06-17",
            "end": "2023-08",
            "close": "2024-02",
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 3,
          "同期或滞后确认": 6,
          "误报": 6,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N3",
        "kind": "watch",
        "indicator": null,
        "name": "N3“有苗头”：长短期利差、申领失业救济人数两项同时越线",
        "against": "N3",
        "window_months": 12,
        "judged_start": "1982-01",
        "rounds": [
          {
            "start": "1989-10",
            "visible": "1989-11-10",
            "end": "1989-12",
            "close": "1990-06",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "1990-08",
            "lead_months": 9
          },
          {
            "start": "2000-11",
            "visible": "2000-12-10",
            "end": "2001-02",
            "close": "2001-08",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2001-04",
            "lead_months": 4
          },
          {
            "start": "2020-03",
            "visible": "2020-04-10",
            "end": "2020-03",
            "close": "2020-09",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2020-03",
            "lag_months": 1
          },
          {
            "start": "2023-06",
            "visible": "2023-07-10",
            "end": "2023-08",
            "close": "2024-02",
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 2,
          "同期或滞后确认": 1,
          "误报": 1,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N4",
        "kind": "indicator",
        "indicator": "16",
        "name": "16 制造业 PMI 新出口订单指数 偏低",
        "against": "N4",
        "window_months": 12,
        "judged_start": "2010-01",
        "rounds": [
          {
            "start": "2011-08",
            "visible": "2011-09-04",
            "end": "2013-06",
            "close": "2013-12",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2014-02",
            "visible": "2014-03-04",
            "end": "2014-02",
            "close": "2014-08",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2014-03",
            "lag_months": 0
          },
          {
            "start": "2014-11",
            "visible": "2014-12-04",
            "end": "2016-02",
            "close": "2016-08",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2015-05",
            "lead_months": 5
          },
          {
            "start": "2018-09",
            "visible": "2018-10-04",
            "end": "2020-06",
            "close": "2020-12",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2019-02",
            "lead_months": 4
          },
          {
            "start": "2021-07",
            "visible": "2021-08-04",
            "end": "2024-02",
            "close": "2024-08",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2025-01",
            "visible": "2025-02-04",
            "end": "2026-02",
            "close": "2026-08",
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 2,
          "同期或滞后确认": 1,
          "误报": 3,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N4",
        "kind": "watch",
        "indicator": null,
        "name": "N4“有苗头”：制造业 PMI 新出口订单越线",
        "against": "N4",
        "window_months": 12,
        "judged_start": "2010-02",
        "rounds": [
          {
            "start": "2011-08",
            "visible": "2011-09-20",
            "end": "2013-06",
            "close": "2013-12",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2014-02",
            "visible": "2014-03-20",
            "end": "2014-02",
            "close": "2014-08",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2014-03",
            "lag_months": 0
          },
          {
            "start": "2014-11",
            "visible": "2014-12-20",
            "end": "2015-04",
            "close": "2015-10",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2015-05",
            "lead_months": 5
          },
          {
            "start": "2018-09",
            "visible": "2018-10-20",
            "end": "2019-08",
            "close": "2020-03",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2019-02",
            "lead_months": 4
          },
          {
            "start": "2021-07",
            "visible": "2021-08-20",
            "end": "2022-09",
            "close": "2023-04",
            "unknown_start": false,
            "category": "误报"
          },
          {
            "start": "2023-05",
            "visible": "2023-06-20",
            "end": "2023-05",
            "close": "2023-11",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2022-11",
            "lag_months": 7
          },
          {
            "start": "2024-02",
            "visible": "2024-03-20",
            "end": "2024-02",
            "close": "2024-08",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2022-11",
            "lag_months": 16
          },
          {
            "start": "2025-04",
            "visible": "2025-05-20",
            "end": "2026-02",
            "close": "2026-08",
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 2,
          "同期或滞后确认": 3,
          "误报": 3,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N5",
        "kind": "watch",
        "indicator": null,
        "name": "N5“有苗头”：最近 1 个月比去年同月高出 0.3 个百分点以上，但还没有触发",
        "against": "N5",
        "window_months": 12,
        "judged_start": "2019-01",
        "rounds": [
          {
            "start": "2019-02",
            "visible": "2019-03-20",
            "end": "2020-08",
            "close": "2021-02",
            "unknown_start": false,
            "category": "提前命中",
            "event_start": "2020-03",
            "lead_months": 12
          },
          {
            "start": "2022-03",
            "visible": "2022-04-20",
            "end": "2022-12",
            "close": "2023-06",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2022-04",
            "lag_months": 0
          }
        ],
        "summary": {
          "提前命中": 1,
          "同期或滞后确认": 1,
          "误报": 0,
          "待观察": 0,
          "起点未知": 0
        }
      },
      {
        "node": "N6",
        "kind": "watch",
        "indicator": null,
        "name": "N6“增速放缓”：实际累计同比比上年同期低 2 个百分点以上",
        "against": "N6",
        "window_months": 12,
        "judged_start": "2015-01",
        "rounds": [
          {
            "start": "2020-07",
            "visible": "2020-10-25",
            "end": "2020-10",
            "close": "2021-04",
            "unknown_start": false,
            "category": "同期或滞后确认",
            "event_start": "2020-01",
            "lag_months": 9
          },
          {
            "start": "2022-01",
            "visible": "2022-04-25",
            "end": "2022-10",
            "close": "2023-04",
            "unknown_start": false,
            "category": "误报"
          }
        ],
        "summary": {
          "提前命中": 0,
          "同期或滞后确认": 1,
          "误报": 1,
          "待观察": 0,
          "起点未知": 0
        }
      }
    ],
    "n4_rule_comparison": [
      {
        "rule": "出口额三个月合计同比为负，以 1 月结尾的窗口不判断",
        "rounds": [
          {
            "start": "1993-08",
            "visible": "1993-09-20",
            "end": "1993-08",
            "close": "1994-03",
            "unknown_start": false
          },
          {
            "start": "1996-02",
            "visible": "1996-03-20",
            "end": "1996-08",
            "close": "1997-03",
            "unknown_start": false
          },
          {
            "start": "1998-09",
            "visible": "1998-10-20",
            "end": "1999-06",
            "close": "1999-12",
            "unknown_start": false
          },
          {
            "start": "2009-02",
            "visible": "2009-03-20",
            "end": "2009-11",
            "close": "2010-06",
            "unknown_start": false
          },
          {
            "start": "2014-03",
            "visible": "2014-04-20",
            "end": "2014-04",
            "close": "2014-10",
            "unknown_start": false
          },
          {
            "start": "2015-05",
            "visible": "2015-06-20",
            "end": "2017-02",
            "close": "2017-08",
            "unknown_start": false
          },
          {
            "start": "2019-02",
            "visible": "2019-03-20",
            "end": "2020-06",
            "close": "2020-12",
            "unknown_start": false
          },
          {
            "start": "2022-11",
            "visible": "2022-12-20",
            "end": "2024-05",
            "close": "2024-11",
            "unknown_start": false
          }
        ]
      },
      {
        "rule": "单月出口额连续 2 个月同比下降",
        "rounds": [
          {
            "start": "1995-12",
            "visible": "1996-01-20",
            "end": "1996-06",
            "close": "1996-12",
            "unknown_start": false
          },
          {
            "start": "1998-09",
            "visible": "1998-10-20",
            "end": "1999-04",
            "close": "1999-10",
            "unknown_start": false
          },
          {
            "start": "2008-12",
            "visible": "2009-01-20",
            "end": "2009-11",
            "close": "2010-05",
            "unknown_start": false
          },
          {
            "start": "2014-03",
            "visible": "2014-04-20",
            "end": "2014-03",
            "close": "2014-09",
            "unknown_start": false
          },
          {
            "start": "2015-04",
            "visible": "2015-05-20",
            "end": "2016-12",
            "close": "2017-06",
            "unknown_start": false
          },
          {
            "start": "2019-09",
            "visible": "2019-10-20",
            "end": "2020-03",
            "close": "2020-09",
            "unknown_start": false
          },
          {
            "start": "2022-11",
            "visible": "2022-12-20",
            "end": "2024-04",
            "close": "2024-10",
            "unknown_start": false
          }
        ]
      }
    ],
    "cases": [
      {
        "pair": [
          "N2",
          "N3"
        ],
        "window_months": 24,
        "next_judged_start": "1959-12",
        "items": [
          {
            "prev_start": "1929-10",
            "prev_visible": "1929-10-29",
            "label": "数据不足"
          },
          {
            "prev_start": "1937-09",
            "prev_visible": "1937-09-08",
            "label": "数据不足"
          },
          {
            "prev_start": "1940-05",
            "prev_visible": "1940-05-15",
            "label": "数据不足"
          },
          {
            "prev_start": "1941-12",
            "prev_visible": "1941-12-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1946-09",
            "prev_visible": "1946-09-04",
            "label": "数据不足"
          },
          {
            "prev_start": "1949-06",
            "prev_visible": "1949-06-14",
            "label": "数据不足"
          },
          {
            "prev_start": "1957-10",
            "prev_visible": "1957-10-22",
            "label": "数据不足"
          },
          {
            "prev_start": "1962-05",
            "prev_visible": "1962-05-29",
            "label": "未触发"
          },
          {
            "prev_start": "1966-08",
            "prev_visible": "1966-08-30",
            "label": "未触发"
          },
          {
            "prev_start": "1970-04",
            "prev_visible": "1970-04-23",
            "label": "下一步先触发",
            "next_start": "1969-10",
            "next_visible": "1969-11-10",
            "months": 6
          },
          {
            "prev_start": "1973-11",
            "prev_visible": "1973-11-28",
            "label": "之后触发",
            "next_start": "1974-03",
            "next_visible": "1974-04-10",
            "months": 4
          },
          {
            "prev_start": "1982-03",
            "prev_visible": "1982-03-06",
            "label": "下一步先触发",
            "next_start": "1981-11",
            "next_visible": "1981-12-10",
            "months": 4
          },
          {
            "prev_start": "1987-10",
            "prev_visible": "1987-10-20",
            "label": "未触发"
          },
          {
            "prev_start": "2001-03",
            "prev_visible": "2001-03-13",
            "label": "之后触发",
            "next_start": "2001-06",
            "next_visible": "2001-07-10",
            "months": 3
          },
          {
            "prev_start": "2008-07",
            "prev_visible": "2008-07-10",
            "label": "下一步先触发",
            "next_start": "2008-04",
            "next_visible": "2008-05-10",
            "months": 3
          },
          {
            "prev_start": "2020-03",
            "prev_visible": "2020-03-13",
            "label": "之后触发",
            "next_start": "2020-04",
            "next_visible": "2020-05-10",
            "months": 1
          },
          {
            "prev_start": "2022-06",
            "prev_visible": "2022-06-14",
            "label": "未触发"
          }
        ],
        "manual": []
      },
      {
        "pair": [
          "N3",
          "N4"
        ],
        "window_months": 24,
        "next_judged_start": "1993-03",
        "items": [
          {
            "prev_start": "1960-08",
            "prev_visible": "1960-09-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1969-10",
            "prev_visible": "1969-11-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1974-03",
            "prev_visible": "1974-04-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1976-11",
            "prev_visible": "1976-12-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1980-04",
            "prev_visible": "1980-05-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1981-11",
            "prev_visible": "1981-12-10",
            "label": "数据不足"
          },
          {
            "prev_start": "1990-11",
            "prev_visible": "1990-12-10",
            "label": "数据不足"
          },
          {
            "prev_start": "2001-06",
            "prev_visible": "2001-07-10",
            "label": "未触发"
          },
          {
            "prev_start": "2008-04",
            "prev_visible": "2008-05-10",
            "label": "之后触发",
            "next_start": "2009-02",
            "next_visible": "2009-03-20",
            "months": 10
          },
          {
            "prev_start": "2020-04",
            "prev_visible": "2020-05-10",
            "label": "下一步先触发",
            "next_start": "2019-02",
            "next_visible": "2019-03-20",
            "months": 14
          },
          {
            "prev_start": "2024-07",
            "prev_visible": "2024-08-10",
            "label": "下一步先触发",
            "next_start": "2022-11",
            "next_visible": "2022-12-20",
            "months": 20
          }
        ],
        "manual": []
      },
      {
        "pair": [
          "N4",
          "N5"
        ],
        "window_months": 24,
        "next_judged_start": "2019-01",
        "items": [
          {
            "prev_start": "1993-08",
            "prev_visible": "1993-09-20",
            "label": "数据不足"
          },
          {
            "prev_start": "1996-02",
            "prev_visible": "1996-03-20",
            "label": "数据不足"
          },
          {
            "prev_start": "1998-09",
            "prev_visible": "1998-10-20",
            "label": "数据不足"
          },
          {
            "prev_start": "2009-02",
            "prev_visible": "2009-03-20",
            "label": "数据不足"
          },
          {
            "prev_start": "2014-03",
            "prev_visible": "2014-04-20",
            "label": "数据不足"
          },
          {
            "prev_start": "2015-05",
            "prev_visible": "2015-06-20",
            "label": "数据不足"
          },
          {
            "prev_start": "2019-02",
            "prev_visible": "2019-03-20",
            "label": "之后触发",
            "next_start": "2020-03",
            "next_visible": "2020-04-20",
            "months": 13
          },
          {
            "prev_start": "2022-11",
            "prev_visible": "2022-12-20",
            "label": "下一步先触发",
            "next_start": "2022-04",
            "next_visible": "2022-05-20",
            "months": 7
          }
        ],
        "manual": [
          {
            "id": "2009-migrant-workers",
            "pair": [
              "N4",
              "N5"
            ],
            "time": "2009 年初",
            "title": "全国约 2,000 万农民工失岗返乡",
            "note": "和城镇调查失业率不是同一口径，只作为案例展示，不计入轮数",
            "source_url": "https://www.chinanews.com.cn/cj/gncj/news/2009/02-17/1567343.shtml",
            "source_check": "2026-11-16 打开核对：页面是中新网 2009 年 2 月 17 日发布的报道，写有全国约有 2000 万农民工失岗返乡",
            "label": "人工案例"
          }
        ]
      },
      {
        "pair": [
          "N5",
          "N6"
        ],
        "window_months": 24,
        "next_judged_start": "2015-01",
        "items": [
          {
            "prev_start": "2020-03",
            "prev_visible": "2020-04-20",
            "label": "下一步先触发",
            "next_start": "2020-01",
            "next_visible": "2020-04-25",
            "months": 2
          },
          {
            "prev_start": "2022-04",
            "prev_visible": "2022-05-20",
            "label": "未触发"
          }
        ],
        "manual": []
      }
    ],
    "periods": [
      {
        "id": "2008",
        "name": "2008 年那一轮",
        "start": "2007-10",
        "end": "2009-12",
        "nodes": [
          {
            "node": "N1",
            "status": "有数据",
            "judged_start": "2004-04",
            "rounds": [
              {
                "start": "2004-04",
                "visible": "2004-05-25",
                "end": "2007-10",
                "close": "2009-02",
                "unknown_start": true
              }
            ]
          },
          {
            "node": "N2",
            "status": "有数据",
            "judged_start": "1929-01",
            "rounds": [
              {
                "start": "2008-07",
                "visible": "2008-07-10",
                "end": "2009-09",
                "close": "2010-03",
                "unknown_start": false
              }
            ]
          },
          {
            "node": "N3",
            "status": "有数据",
            "judged_start": "1959-12",
            "rounds": [
              {
                "start": "2008-04",
                "visible": "2008-05-10",
                "end": "2010-05",
                "close": "2010-11",
                "unknown_start": false
              }
            ]
          },
          {
            "node": "N4",
            "status": "有数据",
            "judged_start": "1993-03",
            "rounds": [
              {
                "start": "2009-02",
                "visible": "2009-03-20",
                "end": "2009-11",
                "close": "2010-06",
                "unknown_start": false
              }
            ]
          },
          {
            "node": "N5",
            "status": "数据不足",
            "judged_start": "2019-01",
            "rounds": []
          },
          {
            "node": "N6",
            "status": "数据不足",
            "judged_start": "2015-01",
            "rounds": []
          }
        ]
      }
    ],
    "skipped": [
      {
        "what": "12 萨姆规则读数 的 2025-10",
        "reason": "这些月份没有数据，按不判断处理"
      },
      {
        "what": "N1 的“有苗头”条件（3 项里恰好 1 项偏高）",
        "reason": "N1 是状态，没有自己的事件，方案只要求它的 3 项和“已出现”条件做分类统计"
      },
      {
        "what": "N3→N4 案例：N3 始于 1959-12 的一轮",
        "reason": "这一轮是历史第一条数据就满足，起点未知，不列案例"
      }
    ]
  }
};
