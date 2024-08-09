'use server'

import { getDictionaryValue, insertDictionaryValue } from '@db'
import type { ActionGetResponse } from '@solana/actions'
import { assertAuth } from '@/auth'

export async function setBettingActionConfigAction(config: ActionGetResponse) {
  await assertAuth()
  return await insertDictionaryValue('actions-config-betting', config, true)
}

export async function getBettingActionConfigAction() {
  try {
    const config = await getDictionaryValue<ActionGetResponse>('actions-config-betting')
    if (!config)
      throw new Error('not found')
    return config
  }
  catch {
    return await insertDictionaryValue('actions-config-betting', {
      title: 'Blink Test',
      description: 'Test blink functional',
      label: 'transfer 1 lamport to 4nKi...sT5o',
      icon: 'https://placehold.co/400x400',
      links: {
        actions: [
          {
            label: '0.1 SOL 单',
            href: '/api/actions/betting/bet?plan=0',
          },
          {
            label: '0.1 SOL 双',
            href: '/api/actions/betting/bet?plan=1',
          },
          {
            label: '5 MUSHU 单',
            href: '/api/actions/betting/bet?plan=2',
          },
          {
            label: '5 MUSHU 双',
            href: '/api/actions/betting/bet?plan=3',
          },
          {
            label: 'Buy MuShu',
            href: '/api/actions/buy',
            parameters: [
              {
                name: 'value',
                label: 'Enter a custom amount',
                required: true,
              },
            ],
          },
        ],
      },
    })
  }
}
