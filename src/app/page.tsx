'use client'

import { useW3, Space, Delegation, DIDKey, Abilities } from '@w3ui/react'
import { DidIcon } from '@/components/DidIcon'
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { SpacesNav } from './space/layout'
import { H2 } from '@/components/Text'
import SidebarLayout from '@/components/SidebarLayout'
import { ReactNode } from 'react'
import { useClaims } from '@/hooks'

export default function HomePage () {
  return (
    <SidebarLayout>
      <SpacePage />
    </SidebarLayout>
  )
}

type RecoverableCapabilities = { [key: DIDKey]: Abilities }

/**
 * A heuristic for determining the "recoverable capabilities" of
 * spaces represented by a set of Delegations. 
 * 
 * First, finds any delegations that delegation * on ucan:*
 * Next, searches through all proofs of these delegations,
 * creating a map from resource names (assumed to be spaces) to a list
 * of capabilities, like:
 * 
 * {
 *   'did:key:zkfirstspace': ['*']
 *   'did:key:zksecondSpace': ['upload/add', 'store/add']
 * }
 */
function guessRecoverableCapabilities(delegations: Delegation[]): RecoverableCapabilities {
  return delegations.filter(d => ((d.capabilities[0].can === '*') && (d.capabilities[0].with === 'ucan:*')))
    .map(d => d.proofs as Delegation[])
    .reduce((m: any, proofs: Delegation[]) => [...m, ...proofs], [])
    .reduce((m: any, proof: Delegation) => {
      for (const capability of proof.capabilities) {
        m[capability.with] = [...(m[capability.with] || []), capability.can]
      }
      return m
    }, {})
}

function SpacePage (): ReactNode {
  const [{ spaces, client }] = useW3()
  const { data: delegations } = useClaims(client)

  if (spaces.length === 0) {
    return <div></div>
  }

  const recoverableCapabilities = delegations && guessRecoverableCapabilities(delegations)

  return (
    <>
      <SpacesNav />
      <H2>Pick a Space</H2>
      <div className='max-w-lg border rounded-md border-zinc-700'>
        {spaces.map(s => <Item space={s} key={s.did()} recoverableAbilities={recoverableCapabilities ? (recoverableCapabilities[s.did()] || []) : undefined} />)}
      </div>
    </>
  )
}

function Item ({ space, recoverableAbilities }: { space: Space, recoverableAbilities?: Abilities }) {
    return (
    <Link href={`/space/${space.did()}`} className='flex flex-row items-start gap-2 p-3 text-white text-left bg-gray-900/30 hover:bg-gray-900/60 border-b last:border-0 border-zinc-700'>
      <DidIcon did={space.did()} />
      <div className='grow overflow-hidden whitespace-nowrap text-ellipsis'>
        <span className='text-md font-semibold leading-5 m-0'>
          {space.name || 'Untitled'}
        </span>
        <span className='font-mono text-xs block'>
          {space.did()}
        </span>
      </div>
      {(typeof recoverableAbilities !== 'undefined') && (
        (recoverableAbilities.length == 0) ? (
          <ShieldExclamationIcon title="Space Not Recoverable" className='h-6 h-6 text-rose-300' />
        ) : (
          <ShieldCheckIcon title="Space Recoverable" className='h-6 w-6 text-emerald-300'/>
        ))}
    </Link>
  )
}
