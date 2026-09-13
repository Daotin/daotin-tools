import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * 缺环境变量时不在模块顶层 throw：那样整个 App 都加载不起来，只剩白屏。
 * 改成导出一句说明，由 App 渲染一张卡片告诉用户少了什么。
 */
export const configError =
  url && anonKey
    ? ''
    : '请在 .env.local 里填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（可参考 .env.example）'

// 占位值只为让 createClient 不抛错，configError 非空时页面根本不会发请求
export const supabase = createClient<Database>(url || 'https://missing.invalid', anonKey || 'missing', {
  global: {
    /**
     * 本地还存着 session、但数据请求被服务端以 401 挡回来（token 已失效）时，
     * 主动登出：onAuthStateChange 推 session=null，RequireAuth 跳登录并带 redirect。
     * auth 接口自己的 401（密码错等）不在此处理，交给调用方显示内联错误。
     */
    fetch: async (input, init) => {
      const res = await fetch(input, init)
      if (res.status === 401 && !String(input instanceof Request ? input.url : input).includes('/auth/v1/')) {
        void supabase.auth.signOut()
      }
      return res
    },
  },
})
