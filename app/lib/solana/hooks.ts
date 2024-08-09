import { useQuery } from '@tanstack/react-query'
import { getLatestBlockhashAction } from './actions'

export function useLatestBlockHashQuery() {
  return useQuery({
    queryKey: ['solana', 'latestBlockHash'],
    queryFn: async () => {
      return await getLatestBlockhashAction()
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  })
}
