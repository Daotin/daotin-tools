/** 全站共用的本地日期工具：倒数日和经期都按"本地零点"比较日期。 */

/** 'YYYY-MM-DD' → 本地零点的 Date（new Date(str) 会按 UTC 解析，差一天）。 */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date → 'YYYY-MM-DD'，给 <input type="date"> 和数据库用。 */
export function toDateString(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}
