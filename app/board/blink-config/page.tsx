'use client'
import type { Monaco } from '@monaco-editor/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { editor } from 'monaco-editor'
import type { ActionGetResponse } from '@solana/actions'
import { motion } from 'framer-motion'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import { ActionEditor } from './components/editor'
import { BlinkPreview, BlinkPreviewErrorView } from './components/blink-preview'
import { getBettingActionConfigAction, setBettingActionConfigAction } from './lib/actions'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import './style.scss'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'

export default function BoardPage() {
  const monacoRef = useRef<Monaco | null>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor>()
  const [tempData, setTempData] = useState<string>('')
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{ data?: ActionGetResponse, error?: string }>({ data: undefined, error: undefined })
  // const [codeMode, setCodeMode] = useState(false)
  const toast = useToast()
  const { data: actionData, isFetching, refetch } = useQuery({
    queryKey: ['action'],
    queryFn: () => getBettingActionConfigAction(),
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
  const { mutateAsync, isPending: saving } = useMutation({
    mutationKey: ['action'],
    mutationFn: async () => {
      return await setBettingActionConfigAction(previewData.data!)
    },
  })

  const openDialto = useCallback(() => {
    const url = `https://dial.to/devnet?action=solana-action:${location.origin}/api/actions/betting`
    window.open(url)
  }, [])

  function onEditorMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    monacoRef.current = monaco
    editorRef.current = editor
    editor.setModel(monaco.editor.createModel(JSON.stringify(actionData, null, 2), 'json'))
  }

  function save() {
    if (previewData.data) {
      setConfirmSaveOpen(false)
      mutateAsync().then(() => {
        toast.toast({
          description: '✅ Save Success',
        })
      }).catch((err) => {
        toast.toast({
          title: '❌ Save Failed',
          description: err.message,
          variant: 'destructive',
        })
      })
    }
  }

  useEffect(() => {
    if (actionData) {
      setTempData(JSON.stringify(actionData, null, 2))
      setPreviewData({ data: actionData, error: undefined })
    }
  }, [actionData, setTempData, setPreviewData])

  useEffect(() => {
    if (!monacoRef.current)
      return
    editorRef.current?.setValue(JSON.stringify(actionData, null, 2))
  }, [actionData])

  useEffect(() => {
    if (!tempData)
      return
    try {
      const markers = monacoRef.current?.editor.getModelMarkers({})
      const marker = markers?.find(marker => marker.severity === 8)
      if (marker) {
        throw new Error('Invalid JSON')
      }
      setPreviewData({ data: JSON.parse(tempData), error: undefined })
    }
    catch (err: any) {
      setPreviewData(prev => ({ data: prev.data, error: err.message }))
    }
  }, [tempData, setPreviewData])

  return (
    <div className={cn('col')}>
      <h1 className={cn('font-bold text-2xl my-2')}>
        Blink 配置
        <span className={cn('font-light text-foreground/50 text-sm ml-4')}>
          /api/actions/betting
        </span>
      </h1>

      <div className={cn('my-2 row items-center justify-end space-x-4')}>
        {/* <div className="row items-center space-x-2">
          <Switch checked={codeMode} onCheckedChange={setCodeMode} id="set-preview-mode" />
          <Label htmlFor="set-preview-mode">
            编辑模式
          </Label>
        </div> */}
        <p className={cn('text-xs', !previewData.data && 'hidden')}>
          {previewData.error
            ? (
                <span className={cn('text-destructive')}>{previewData.error}</span>
              )
            : (
                <motion.span
                  key={previewData.error}
                  animate={{ rotateZ: [0, -5, 0, 5, 0] }}
                  className={cn('text-green-500')}
                  transition={{ duration: 0.3, type: 'spring' }}
                >
                  配置正确
                </motion.span>
              )}
        </p>

        <Button
          variant="secondary"
          onClick={() => refetch()}
        >
          <span className={cn('block mr-2 h-4 w-4', isFetching ? 'i-line-md-loading-twotone-loop' : 'i-mdi-refresh')} />
          重置并刷新
        </Button>

        <Button
          variant="outline"
          onClick={openDialto}
        >
          前往预览
        </Button>

        <Popover
          open={confirmSaveOpen}
          onOpenChange={setConfirmSaveOpen}
        >
          <Button
            asChild
            className={cn('mr-2')}
            disabled={saving}
            onClick={() => {}}
          >
            <PopoverTrigger>
              {saving && <span className={cn('block mr-2 h-4 w-4', 'i-line-md-loading-twotone-loop')} />}
              保存
            </PopoverTrigger>
          </Button>
          <PopoverContent>
            <div className={cn('row gap-2 items-center')}>
              <p className={cn('text-sm grow')}>
                确认保存配置吗?
              </p>
              <Button
                size="sm"
                onClick={save}
              >
                确定保存
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />
      <div className={cn('row grow min-h-[80vh]')}>
        {isFetching || !previewData.data
          ? <div className={cn('i-line-md-loading-alt-loop', 'w-full place-self-center')} />
          : (
              <>
                <div className={cn('grow w-[50%] col items-center justify-center p-4')}>
                  <ErrorBoundary errorComponent={BlinkPreviewErrorView}>
                    <BlinkPreview
                      data={previewData.data!}
                      url={location.origin}
                    />
                  </ErrorBoundary>
                </div>

                <Separator orientation="vertical" />

                <div className={cn('grow w-[50%]')}>
                  {actionData && (
                    <ActionEditor
                      onChange={value => setTempData(value)}
                      onMount={onEditorMount}
                    />
                  )}
                </div>
              </>
            )}
      </div>
    </div>
  )
}
