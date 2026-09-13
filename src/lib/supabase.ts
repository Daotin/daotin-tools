import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    '缺少 Supabase 环境变量：请在 .env.local 里填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（可参考 .env.example）',
  )
}

export const supabase = createClient<Database>(url, anonKey)
