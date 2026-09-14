import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Briefcase,
  Cake,
  Car,
  Dumbbell,
  Flag,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Music,
  PawPrint,
  Plane,
  Users,
  Wallet,
} from 'lucide-react'

/**
 * 可选图标。数据库里存的是这里的 key，所以 key 只能加不能改名——
 * 改名会让已有记录查不到，静默退回默认图标。
 */
export const EVENT_ICONS: Record<string, LucideIcon> = {
  cake: Cake,
  heart: Heart,
  plane: Plane,
  gift: Gift,
  house: House,
  wallet: Wallet,
  briefcase: Briefcase,
  graduation: GraduationCap,
  users: Users,
  health: HeartPulse,
  car: Car,
  pet: PawPrint,
  book: BookOpen,
  sport: Dumbbell,
  music: Music,
  flag: Flag,
}

/** 给选择器用的固定顺序，和上面的字面量顺序一致。 */
export const ICON_KEYS = Object.keys(EVENT_ICONS)
