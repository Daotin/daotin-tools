# 金融危机预警

下载公开的经济和市场数据，判断风险从海外市场传到国内、再传到个人工资的过程走到了哪一步，生成页面 `/crisis/` 用的数据文件。

## 目录

| 位置 | 是什么 |
| --- | --- |
| `crisis/pipeline/` | 更新程序。`run.py` 是入口，依次做取数、回测、计算、生成 |
| `crisis/config/` | 指标、节点、历史案例的配置 |
| `crisis/tests/` | 单元测试 |
| `crisis/data/manual.csv` | 人工录入的数据，进仓库 |
| `crisis/data/raw/`、`fetch_status.json`、`backtest.json` | 下载的原始数据、下载结果、回测结果，只在本机，不进仓库 |
| `public/crisis/index.html` | 页面 |
| `public/crisis/data/latest.js` | 页面读取的数据 |
| `public/crisis/data/summary.json` | 给工具站首页卡片用的摘要：预警等级、决定等级的节点、数据不足的节点、计算日期、数据下载时间 |

## 在本机更新数据

在仓库根目录执行。第一次先建虚拟环境、装依赖（用 Python 3.9，和云端任务一致）：

```bash
python3 -m venv crisis/.venv
crisis/.venv/bin/pip install -r crisis/requirements.txt
```

联网下载数据并重新生成：

```bash
crisis/.venv/bin/python crisis/pipeline/run.py
```

只用本机已下载的数据重新计算，不联网：

```bash
crisis/.venv/bin/python crisis/pipeline/run.py --skip-fetch
```

终端会列出预警等级、各节点状态、下载失败的指标。新算出的内容除了生成时间、计算日期、数据下载时间之外和上次完全一样时，不改写 `latest.js` 和 `summary.json`，终端会提示“数据没有变化”。

运行单元测试：

```bash
crisis/.venv/bin/python -m unittest discover -s crisis/tests
```

## 人工录入文件怎么填

`crisis/data/manual.csv` 第一行是表头，从第二行起每行一条，列依次是：编号、日期、数值、来源、口径、链接、实际公布日、说明。

- 编号只能填 9（私人信贷基金限制赎回）、13（外部机构的衰退概率）、22（工商银行一年期整存整取挂牌利率）。
- 日期写成“年-月-日”，例如 `2026-11-01`。
- 编号 13 必须填来源、口径、链接；编号 22 的数值必须是数字。
- 实际公布日、说明可以空着。

填错的行会被跳过，运行时终端的“人工录入文件的问题”里会列出是哪一行、什么原因。

## 云端测试任务

`.github/workflows/crisis-fetch-test.yml`：分支 `feat/crisis-warning` 推送了 `crisis/` 下的改动时自动运行，也可以在 GitHub 的 Actions 页面手动运行。它装依赖、跑单元测试、联网完整更新一次，最后打印有哪些文件变了。目的是看 GitHub 的服务器能不能访问各个数据网站，下载失败的指标会列在输出里。它只测试，不提交、不推送。
