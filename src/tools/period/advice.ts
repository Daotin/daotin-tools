import { differenceInCalendarDays } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { Beef, Bike, Droplets, Flame, Heart, MessageCircle, Pill, Smile, Soup } from 'lucide-react'
import type { Period } from '@/lib/database.types'
import type { Prediction } from './predict'
import { parseDate, periodEnd, startOfDay } from './predict'

export type Phase = 'before' | 'during'

/** 快来了的提前量：预测开始日前 2 天开始提示准备。 */
const LEAD_DAYS = 2

/**
 * 今天该给哪一档建议：
 * - 落在已记录的经期里 → during
 * - 离预测开始日不到 LEAD_DAYS 天，或者已经推迟了 → before
 * - 其余时候（排卵期、平时）不给，别天天占着首屏
 */
export function advicePhase(
  periods: Period[],
  prediction: Prediction | null,
  today: Date = new Date(),
): Phase | null {
  if (!prediction) return null
  const day = startOfDay(today)

  for (const period of periods) {
    const start = parseDate(period.start_date)
    if (day >= start && day <= periodEnd(period, prediction.periodLength)) return 'during'
  }

  // 负数 = 还没到，正数 = 已推迟，两种都该提醒准备
  const left = differenceInCalendarDays(prediction.nextStart, day)
  return left <= LEAD_DAYS ? 'before' : null
}

export type AdviceGroup = { label: string; items: { icon: LucideIcon; text: string }[] }

/** 内容是固定的，不入库、不做后台编辑。 */
export const ADVICE: Record<Phase, { title: string; groups: AdviceGroup[] }> = {
  before: {
    title: '快来了，先备着',
    groups: [
      {
        label: '准备',
        items: [
          { icon: Flame, text: '暖宫贴、暖宝宝放到手边' },
          { icon: Pill, text: '布洛芬备好，随餐或饭后吃' },
          { icon: Soup, text: '红糖姜茶囤一点' },
        ],
      },
    ],
  },
  during: {
    title: '这几天怎么做',
    groups: [
      {
        label: '说',
        items: [
          { icon: Heart, text: '接住情绪，不讲道理不辩对错' },
          { icon: MessageCircle, text: '「有什么需要告诉我，我来做」' },
          { icon: Smile, text: '找点开心的事转移注意力' },
        ],
      },
      {
        label: '做',
        items: [
          { icon: Bike, text: '家务和跑腿抢着做掉，别让她动' },
          { icon: Droplets, text: '睡前热水泡脚' },
          { icon: Soup, text: '点清淡的外卖，别重油重辣' },
          { icon: Beef, text: '补铁：瘦肉、猪肝、蛋、深绿叶菜' },
        ],
      },
    ],
  },
}
