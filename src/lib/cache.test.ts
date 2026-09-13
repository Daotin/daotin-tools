import { beforeEach, expect, test } from 'vitest'
import { CACHE_PREFIX, clearCache, readCache, writeCache } from './cache'

/** node 环境没有 localStorage，用一个 Map 顶上。 */
function fakeStorage() {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  } as unknown as Storage
}

beforeEach(() => {
  globalThis.localStorage = fakeStorage()
})

test('首次没有缓存返回 undefined，写入后能读回来', () => {
  expect(readCache('quit')).toBeUndefined()

  writeCache('quit', { days: 12 })
  expect(readCache('quit')).toEqual({ days: 12 })
  // 未登录时落到 anon 键
  expect(localStorage.getItem(`${CACHE_PREFIX}quit:anon`)).toBe('{"days":12}')
})

test('按登录用户分键，退出登录清掉全部工具缓存', () => {
  localStorage.setItem('sb-abc-auth-token', JSON.stringify({ user: { id: 'u1' } }))
  writeCache('quit', [1])
  expect(localStorage.getItem(`${CACHE_PREFIX}quit:u1`)).toBe('[1]')
  expect(readCache('quit')).toEqual([1])

  clearCache()
  expect(readCache('quit')).toBeUndefined()
  // 只清缓存，不碰 supabase 的登录态
  expect(localStorage.getItem('sb-abc-auth-token')).not.toBeNull()
})
