import { useCallback, useEffect, useState } from 'react'

/**
 * 工具数据的本地缓存：先拿上次的结果显示（不出骨架屏），再后台请求覆盖。
 * 键是 `dt:cache:<tool>:<user_id>`，退出登录时按 CACHE_PREFIX 整体清掉。
 */
export const CACHE_PREFIX = 'dt:cache:'

/**
 * 同步取当前用户 id：supabase 把 session 存在 localStorage 的 `sb-<ref>-auth-token` 里，
 * hook 初始化时 getSession() 还没回来，只能直接读这份存储。读不到就用 'anon'。
 */
function currentUserId(): string {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue
      let raw = localStorage.getItem(key) ?? ''
      // 新版 supabase-js 会把 JSON 再包一层 base64
      if (raw.startsWith('base64-')) raw = atob(raw.slice(7))
      return JSON.parse(raw)?.user?.id ?? 'anon'
    }
  } catch {
    // 读不出来就当没登录，缓存退化成按设备存
  }
  return 'anon'
}

function cacheKey(tool: string) {
  return `${CACHE_PREFIX}${tool}:${currentUserId()}`
}

export function readCache<T>(tool: string): T | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(tool))
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

export function writeCache(tool: string, value: unknown) {
  try {
    localStorage.setItem(cacheKey(tool), JSON.stringify(value))
  } catch {
    // 配额满或隐私模式：缓存只是加速，写不进去不影响功能
  }
}

/** 退出登录时清掉全部工具缓存，换账号不会看到上一个人的数据。 */
export function clearCache() {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key)
    }
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    // 同上
  }
}

/**
 * 有缓存就同步作为初始值（调用方据此跳过骨架屏），随后照常请求并覆盖、写回缓存。
 * `tool` 传 null 表示这次不读也不写缓存（假数据模式）。
 */
export function useCachedQuery<T>(tool: string | null, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(() => (tool ? (readCache<T>(tool) ?? null) : null))
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const next = await fetcher()
      setData(next)
      setError('')
      if (tool) writeCache(tool, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败')
    }
  }, [tool, fetcher])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, reload }
}
