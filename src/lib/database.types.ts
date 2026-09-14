/** 手写的表结构类型，与 supabase/migrations/0001_init.sql 保持一致。 */

type Base = {
  id: string
  user_id: string
  created_at: string
}
/** 插入时 id / user_id / created_at 都有数据库默认值，可省略 */
type Insert<T> = Partial<Base> & T

export type QuitItem = Base & {
  name: string
  start_at: string
}

export type QuitRelapse = Base & {
  item_id: string
  relapsed_at: string
  note: string | null
  legacy_id: string | null
}

export type CountdownEvent = Base & {
  title: string
  date: string
  is_lunar: boolean
  repeat: 'none' | 'yearly' | 'monthly' | 'weekly'
  category: string
  pinned: boolean
  note: string | null
  /** icons.ts 里的 key，空串表示没选 */
  icon: string
}

export type Period = Base & {
  start_date: string
  end_date: string | null
}

export type Database = {
  public: {
    Tables: {
      quit_items: {
        Row: QuitItem
        Insert: Insert<{ name: string; start_at: string }>
        Update: Partial<QuitItem>
        Relationships: []
      }
      quit_relapses: {
        Row: QuitRelapse
        Insert: Insert<{
          item_id: string
          relapsed_at: string
          note?: string | null
          legacy_id?: string | null
        }>
        Update: Partial<QuitRelapse>
        Relationships: []
      }
      countdown_events: {
        Row: CountdownEvent
        Insert: Insert<{
          title: string
          date: string
          is_lunar?: boolean
          repeat?: CountdownEvent['repeat']
          category: string
          pinned?: boolean
          note?: string | null
          icon?: string
        }>
        Update: Partial<CountdownEvent>
        Relationships: []
      }
      periods: {
        Row: Period
        Insert: Insert<{ start_date: string; end_date?: string | null }>
        Update: Partial<Period>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
