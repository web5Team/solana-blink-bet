import { Editor, type Monaco } from '@monaco-editor/react'
import { useRef } from 'react'
import type { editor } from 'monaco-editor'
import { useDarkTheme } from '@/components/providers/dark-theme'

interface ActionEditorProps {
  onMount: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void
  onChange: (value: string) => void
}

export function ActionEditor({ onMount, onChange }: ActionEditorProps) {
  const monacoRef = useRef<Monaco | null>(null)
  const { theme } = useDarkTheme()

  function setup(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    monacoRef.current = monaco
    onMount(editor, monaco)
    fetch(`/blink/action-get-response.schema.json`).then(res => res.json()).then((schema) => {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [{
          fileMatch: ['*'],
          uri: `${location.href}/blink/action-get-response.schema.json`,
          schema,
        }],
      })
    }).catch(console.warn)
  }

  return (
    <Editor
      defaultLanguage="json"
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onMount={setup}
      onChange={(_) => {
        onChange(_ ?? '')
      }}
    />
  )
}
