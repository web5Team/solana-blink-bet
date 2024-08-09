export function sleep(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration))
}

export function chunk<T>(input: Array<T>, size: number) {
  return input.reduce((arr, item, idx) => {
    return idx % size === 0
      ? [...arr, [item]]
      : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]]
  }, [] as Array<Array<T>>)
}

export function parseUnknownError(err: unknown) {
  switch (typeof err) {
    case 'string':
      return err
    case 'object':
      if (!err) {
        return 'Unknown error'
      }
      else if (err instanceof Error) {
        return String(err.message)
      }
      else if ('message' in err) {
        return String(err.message)
      }
      return JSON.stringify(err)
    default:
      console.warn('parse unknown error:', err)
      return String(err)
  }
}
