import type { ActionGetResponse, LinkedAction } from '@solana/actions'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

// const Alert = () => (
//   <a href="https://docs.dialect.to/documentation/actions/security" target="_blank" rel="noopener noreferrer" className="flex items-center">
//     <div className="group bg-transparent-warning inline-flex items-center justify-center gap-1 rounded-full text-subtext font-semibold leading-none aspect-square p-1">
//       <div className="text-icon-warning group-hover:text-icon-warning-hover transition-colors motion-reduce:transition-none">
//         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet">
//           <path fill="currentColor" fill-rule="evenodd" d="M13.863 3.42 8.38 1.088a.932.932 0 0 0-.787 0L2.108 3.421c-.641.291-1.137.904-1.108 1.662 0 2.916 1.196 8.195 6.212 10.616.496.233 1.05.233 1.546 0 5.016-2.42 6.212-7.7 6.241-10.616 0-.758-.496-1.37-1.137-1.662Zm-6.33 7.35h-.582a.69.69 0 0 0-.7.7c0 .408.292.7.7.7h2.216c.379 0 .7-.292.7-.7 0-.38-.321-.7-.7-.7h-.234V8.204c0-.38-.32-.7-.7-.7H7.208a.69.69 0 0 0-.7.7c0 .408.292.7.7.7h.326v1.866Zm-.466-5.133c0 .525.408.933.933.933a.94.94 0 0 0 .933-.933A.96.96 0 0 0 8 4.704a.94.94 0 0 0-.933.933Z" clip-rule="evenodd"></path>
//         </svg>
//       </div>
//     </div>
//   </a>
// )

function LinkGrid({ actions }: { actions: LinkedAction[] }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2')}>
      {actions.map((action, index) => (
        // action.href maybe undefined
        <div
          key={index}
          className={cn('flex flex-grow basis-[calc(33.333%-2*4px)]')}
        >
          <button className={cn('flex w-full items-center justify-center text-nowrap rounded-button px-6 py-3 text-text font-semibold transition-colors motion-reduce:transition-none bg-button text-text-button hover:bg-button-hover')}>
            {action.label}
          </button>
        </div>
      ))}
    </div>
  )
}

function InputGroup({ actions }: { actions: LinkedAction[] }) {
  return actions.map((action, index) => (
    <div
      key={index}
      className={cn('flex items-center gap-2 rounded-input border border-input-stroke transition-colors focus-within:border-input-stroke-selected motion-reduce:transition-none hover:border-input-stroke-hover hover:focus-within:border-input-stroke-selected')}
    >
      <input
        className="my-3 ml-4 flex-1 truncate bg-input-bg text-text-input outline-none placeholder:text-text-input-placeholder disabled:text-text-input-disabled"
        placeholder={action.parameters?.at(0)!.label}
      />

      <div className={cn('my-2 mr-2')}>
        <button className={cn('flex w-full items-center justify-center text-nowrap rounded-button px-6 py-3 text-text font-semibold transition-colors motion-reduce:transition-none bg-button-disabled text-text-button-disabled')}>
          {action.label}
        </button>
      </div>
    </div>
  ))
}

function MultiInputGroup({ action }: { action: LinkedAction }) {
  return (
    <>
      {action.parameters?.map((param, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-input border border-input-stroke transition-colors focus-within:border-input-stroke-selected motion-reduce:transition-none hover:border-input-stroke-hover hover:focus-within:border-input-stroke-selected"
        >
          <input
            className={cn('my-3 ml-4 flex-1 truncate bg-input-bg text-text-input outline-none placeholder:text-text-input-placeholder disabled:text-text-input-disabled')}
            placeholder={param.label}
          />
        </div>
      ))}
      <button className="flex w-full items-center justify-center text-nowrap rounded-button px-6 py-3 text-text font-semibold transition-colors motion-reduce:transition-none bg-button-disabled text-text-button-disabled">
        {action.label}
      </button>
    </>
  )
}

export function BlinkPreview({ data, url }: { data: ActionGetResponse, url: string }) {
  const _url = new URL(url)

  const linkGroup = useMemo(() => {
    const actions = data.links?.actions.filter(action => (action.parameters?.length ?? 0) === 0) ?? []
    if (!actions.length) {
      return [{
        label: data.label,
      } as LinkedAction]
    }
    return actions
  }, [data])
  const inputGroup = useMemo(() => data.links?.actions.filter(action => (action.parameters?.length ?? 0) > 0) ?? [], [data.links?.actions])
  const multiInputGroup = useMemo(() => data.links?.actions.find(action => (action.parameters?.length ?? 0) > 1), [data.links?.actions])

  return (
    <div
      className={cn('bg-white shadow-lg rounded-[1rem] max-w-[28rem] w-full', 'blink dial-light')}
    >
      <div className={cn('block max-h-[100cqw] overflow-y-hidden px-5 pt-5')}>
        <img
          alt="action-image"
          className={cn('aspect-auto w-full rounded-xl object-cover object-center')}
          src={data.icon}
        />
      </div>

      <div className={cn('flex flex-col p-5')}>

        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center truncate text-subtext text-text-link">{_url.host}</span>
          {/* <Alert /> */}
        </div>

        <span className="mb-0.5 text-text font-semibold text-text-primary">{data.title}</span>
        <span className="mb-4 whitespace-pre-wrap text-subtext text-text-secondary">{data.description}</span>

        <div className={cn('flex flex-col gap-3')}>
          {/* link grid */}
          {(!multiInputGroup && linkGroup.length > 0) && <LinkGrid actions={linkGroup} />}

          {/* input */}
          {(!multiInputGroup && inputGroup.length > 0) && <InputGroup actions={inputGroup} />}

          {multiInputGroup && <MultiInputGroup action={multiInputGroup} />}
        </div>
      </div>
    </div>
  )
}

export function BlinkPreviewErrorView() {
  return (
    <div className={cn('text-destructive font-bold text-center')}>
      Blink Renderer failed...
    </div>
  )
}
