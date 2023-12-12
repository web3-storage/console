import { Account, Capabilities, Client, Delegation, PlanGetSuccess, Tuple } from '@w3ui/react'
import useSWR from 'swr'
import { claimAccess } from '@web3-storage/access/agent'


export const usePlan = (account: Account) =>
  useSWR<PlanGetSuccess | undefined>(`/plan/${account?.did() ?? ''}`, {
    fetcher: async () => {
      if (!account) return
      const result = await account.plan.get()
      if (result.error) throw new Error('getting plan', { cause: result.error })
      return result.ok
    },
    onError: err => console.error(err.message, err.cause)
  })

export const useClaims = (client: Client | undefined) =>
  useSWR<Tuple<Delegation<Capabilities>> | undefined>(client && `/claims/${client.agent.did()}`, {
    fetcher: async () => {
      if (!client) return
      return await client.capability.access.claim()
    },
    onError: err => console.error(err.message, err.cause)
  })