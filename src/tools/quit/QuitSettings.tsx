import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { importAntix, parseAntixImport } from './data'

export function QuitSettings() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function onImport() {
    if (!file) return
    setBusy(true)
    setResult('')
    setError('')
    try {
      const { added, skipped } = await importAntix(parseAntixImport(await file.text()))
      setResult(`已导入 ${added} 条，跳过重复 ${skipped} 条`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="mt-1 mb-4 font-rounded text-title">戒烟设置</h1>
      <div className="rounded-md bg-surface p-5">
        <div className="text-heading">导入 AntiX 数据</div>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-4 w-full text-body-sm text-foreground-secondary file:mr-3 file:h-10 file:rounded-pill file:border-0 file:bg-background file:px-4 file:font-rounded file:text-body-sm file:font-semibold file:text-foreground"
        />
        <Button
          className="mt-4 w-full bg-tool-solid text-white"
          disabled={!file || busy}
          onClick={onImport}
        >
          导入
        </Button>
        {result && <p className="mt-3 text-body-sm text-foreground-secondary">{result}</p>}
        {error && <p className="mt-3 text-body-sm text-red-solid">{error}</p>}
      </div>
      <p className="mt-3 text-caption text-foreground-secondary">
        导入会按原记录 ID 去重，重复导入不会产生重复数据。
      </p>
    </>
  )
}
