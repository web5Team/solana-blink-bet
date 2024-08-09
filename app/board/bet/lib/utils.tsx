import Link from 'next/link'
import { dayjs } from '@/lib/utils'

export function simpleFormatDate(date: any) {
  if (!date)
    return 'N/A'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function renderDateWithRelative({ cell: { getValue } }: { cell: { getValue: () => any } }) {
  const value = getValue()
  if (!value)
    return 'N/A'
  const date = dayjs(value)

  return (
    <div className="col items-stretch">
      <div className="text-xs text-nowrap">{date.format('YYYY-MM-DD HH:mm:ss')}</div>
      <div className="text-gray-400 text-xs">
        {date.fromNow()}
      </div>
    </div>
  )
}

export function renderLinkToSolscanTx({ cell: { getValue } }: { cell: { getValue: () => any } }) {
  return getValue()
    ? (
        <Link
          className="max-w-[12rem] inline-block text-ellipsis overflow-hidden decoration-dotted underline text-blue-500"
          href={`https://solscan.io/tx/${getValue()}`}
          target="_blank"
        >
          {getValue()}
        </Link>
      )
    : 'N/A'
}

export function renderLinkToSolscanAccount({ cell: { getValue } }: { cell: { getValue: () => any } }) {
  return getValue()
    ? (
        <Link
          className="max-w-[12rem] inline-block text-ellipsis overflow-hidden decoration-dotted underline text-blue-500"
          href={`https://solscan.io/account/${getValue()}`}
          target="_blank"
        >
          {getValue()}
        </Link>
      )
    : 'N/A'
}
