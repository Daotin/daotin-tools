import { useSyncExternalStore } from 'react'

type Entry = { subscribe: (onChange: () => void) => () => void; matches: () => boolean }

/** 同一个断点全站共用一个 MediaQueryList，不用每个组件挂一个监听。 */
const cache = new Map<string, Entry>()

function entryOf(query: string): Entry {
  let entry = cache.get(query)
  if (!entry) {
    const mql = window.matchMedia(query)
    entry = {
      subscribe: (onChange) => {
        mql.addEventListener('change', onChange)
        return () => mql.removeEventListener('change', onChange)
      },
      matches: () => mql.matches,
    }
    cache.set(query, entry)
  }
  return entry
}

/** 断点查询，如 useMediaQuery('(min-width: 80rem)')。窗口变化会重渲染。 */
export function useMediaQuery(query: string): boolean {
  const entry = entryOf(query)
  return useSyncExternalStore(entry.subscribe, entry.matches)
}
