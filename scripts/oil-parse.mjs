/**
 * 汽油价格网（qiyoujiage.com）湖北页的解析与校验。纯函数，不联网、不读写文件，方便测试。
 * 页面上价格和标签分在不同标签里（`<dt>湖北92号汽油</dt><dd>8.31(元)</dd>`），
 * 所以先把标签全删成空格再用正则，不按标签结构匹配。
 */

/** HTML → 纯文本：去掉 script/style，标签换成空格，压缩空白。 */
export function toText(html) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * 解析 92 号汽油价格、页面日期、下次调价预告。
 * 任一项解析不到就是 null，由调用方决定是否致命（预告不致命）。
 */
export function parseOilPage(html) {
  const text = toText(html)
  const price = text.match(/92\s*号汽油\s*([\d.]+)\s*[（(]\s*元\s*[）)]/)
  const date = text.match(/油价\s*(\d{4})-(\d{1,2})-(\d{1,2})/)
  const next = text.match(/下次油价[^,，。；;]*?调整/)
  return {
    p92: price ? Number(price[1]) : null,
    source_date: date
      ? `${date[1]}-${String(date[2]).padStart(2, '0')}-${String(date[3]).padStart(2, '0')}`
      : null,
    next_adjustment_text: next ? next[0].trim() : null,
  }
}

/** 北京时间的 YYYY-MM-DD。抓取跑在 GitHub Actions 的 UTC 机器上，不能用本地时区。 */
export function beijingDate(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

/**
 * 校验：价格是 5–15 的有限数；页面日期能解析且不早于今天 20 天。
 * 返回不通过的原因数组，空数组代表通过。
 */
export function validate(parsed, today = beijingDate()) {
  const errors = []
  const { p92, source_date } = parsed

  if (typeof p92 !== 'number' || !Number.isFinite(p92)) {
    errors.push('没解析到 92 号汽油价格')
  } else if (p92 < 5 || p92 > 15) {
    errors.push(`价格 ${p92} 不在 5–15 元/升之间`)
  }

  if (!source_date || Number.isNaN(Date.parse(source_date))) {
    errors.push('没解析到页面日期')
  } else {
    const days = Math.round((Date.parse(today) - Date.parse(source_date)) / 86400000)
    if (days > 20) errors.push(`页面日期 ${source_date} 比今天早 ${days} 天，疑似抓到缓存页`)
  }

  return errors
}

/**
 * 价格变化才追加一条。history 按 observed_date 升序，
 * 最后一条价格与本次相同则原样返回（调用方据此决定不写文件）。
 */
export function appendHistory(history, p92, today = beijingDate()) {
  const last = history.at(-1)
  if (last && last.p92 === p92) return history
  return [...history, { observed_date: today, p92 }]
}
