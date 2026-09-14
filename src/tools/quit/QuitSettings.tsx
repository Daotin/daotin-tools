import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
      <h1 className="mt-1 mb-6 text-2xl font-semibold tracking-tight">戒烟设置</h1>
      <Card>
        <CardHeader>
          <CardTitle>导入 AntiX 数据</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="antix-file">备份文件</FieldLabel>
              <Input
                id="antix-file"
                type="file"
                accept="application/json,.json"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <FieldDescription>导入会按原记录 ID 去重，重复导入不会产生重复数据。</FieldDescription>
            </Field>
            {error && <FieldError errors={[{ message: error }]} />}
            <Field>
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!file}
                loading={busy}
                onClick={onImport}
              >
                导入
              </Button>
              {result && <FieldDescription>{result}</FieldDescription>}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </>
  )
}
