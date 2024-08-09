import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import _dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

_dayjs.extend(utc)
_dayjs.extend(timezone)
_dayjs.extend(relativeTime)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const dayjs = _dayjs
