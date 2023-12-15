import type { ChangeEvent, ReactNode } from 'react'
import type { OwnedSpace } from '@web3-storage/access/space'
import * as W3Space from '@web3-storage/w3up-client/space'

import React, { useState } from 'react'
import { Wizard, useWizard } from 'react-use-wizard';
import { SpaceDID, useW3 } from '@w3ui/react'
import Loader from '../components/Loader'
import { Failure } from '@ucanto/interface'
import { DidIcon } from './DidIcon'
import Link from 'next/link'
import { usePlan } from '@/hooks';

interface SpaceCreatorWizardLoaderProps {
  message: string
  className?: string
}

export function SpaceCreatorWizardLoader ({ message, className = 'flex flex-col items-center space-y-4' }: SpaceCreatorWizardLoaderProps): ReactNode {
  return (
    <div className={className}>
      <h5>{message}</h5>
      <Loader className='w-6' />
    </div>
  )
}

const SpaceCreatorCreating = () => <SpaceCreatorWizardLoader message="Creating Space..." />

interface SpaceCreatorFormProps {
  className?: string
  setOwnedSpace: React.Dispatch<React.SetStateAction<OwnedSpace | undefined>>
}

export function SpaceCreatorForm ({
  className = '',
  setOwnedSpace
}: SpaceCreatorFormProps): ReactNode {
  const [{ client, accounts }] = useW3()
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const { nextStep } = useWizard()

  async function onSubmit (e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!client) return
    // TODO: account selection
    const account = accounts[0]
    if (!account) {
      throw new Error('cannot create space, no account found, have you authorized your email?')
    }

    setSubmitted(true)
    try {
      const space = await client.createSpace(name)
      // @ts-ignore TODO this should be unecessary after we thread the access client dep through the libraries
      setOwnedSpace(space)
      nextStep()
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.error(error)
      throw new Error('failed to create space', { cause: error })
    } finally {
      setSubmitted(false)
    }
  }

  if (submitted) {
    return (
      <div className={className}>
        <SpaceCreatorCreating />
      </div>
    )
  }

  return (
    <div className={className}>
      <form className='' onSubmit={(e: React.FormEvent<HTMLFormElement>) => { void onSubmit(e) }}>
        <input
          className='text-black py-2 px-2 rounded block w-full mb-4 border border-gray-800'
          placeholder='Name'
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value)
          }}
          required={true}
        />
        <button type='submit' className='inline-block bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'>Create</button>
      </form>
    </div>
  )
}

interface SpaceMnemonicFormProps {
  className?: string
  ownedSpace?: OwnedSpace,
  setPreferDelegateRecovery: React.Dispatch<React.SetStateAction<boolean>>
}

export function SpaceMnemonicForm ({
  className = '',
  ownedSpace,
  setPreferDelegateRecovery
}: SpaceMnemonicFormProps): ReactNode {
  const [showMnemonic, setShowMnemonic] = useState(false)
  const { nextStep } = useWizard()
  function saved () {
    nextStep()
  }
  function backup () {
    setPreferDelegateRecovery(true)
    nextStep()
  }
  const mnemonic = ownedSpace && W3Space.toMnemonic(ownedSpace)
  return (
    <div className={className}>
      <div className='max-w-xl text-sm leading-6'>
        <p className='my-2'>
          Your space is controlled by a private key. We&apos;ll give you an opportunity to delegate
          the ability to recover control over your space to our service, but we won&apos;t store
          your private key.
        </p>
        <p className='my-2'>
          In order to ensure you don&apos;t lose access to your space, please write down the
          following phrase and keep it in a secure place like 1Password or a piece of paper
          in a safe. It is a representation of your private key, and anybody with access
          to this phrase will be able to control and access your space. Keep it secret, keep
          it safe!
        </p>
      </div>
      <button className='bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'
        onClick={() => setShowMnemonic(!showMnemonic)}>
        {showMnemonic ? 'Hide Recovery Phrase' : 'Show Recovery Phrase'}
      </button>
      <code className='block bg-white/50 p-2 mx-2 my-4'>
        {showMnemonic ? mnemonic : ''}
      </code>
      <div className='flex flex-row space-x-4 mt-4'>
        <button className='bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'
          onClick={saved}>
          OK, I&apos;ve saved it.
        </button>
        <button className='bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'
          onClick={backup}>
          I&apos;d prefer to back it up with your service.
        </button>
      </div>
    </div>
  )
}

interface SpaceBillingFormProps {
  className?: string
  spaceDID?: SpaceDID,
}

export function SpaceBillingForm ({
  className = '',
  spaceDID
}: SpaceBillingFormProps): ReactNode {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const { data: plan, isLoading: planLoading, mutate } = usePlan(account)
  const [error, setError] = useState<Failure | undefined>()
  const [submitted, setSubmitted] = useState(false)

  const { nextStep } = useWizard()
  async function setUpBilling () {
    if (spaceDID) {
      setSubmitted(true)
      try {
        const provisionResult = await account.provision(spaceDID)
        if (provisionResult.ok) {
          nextStep()
        } else {
          setError(provisionResult.error)
        }
      } finally {
        setSubmitted(false)
      }
    }
  }
  function refreshPlan () {
    // calling mutate will refresh plan information
    mutate()
  }
  const buttonDisabled = !spaceDID

  if (submitted) {
    return (
      <div className={className}>
        <SpaceCreatorWizardLoader message={'Setting up billing...'} />
      </div>
    )
  }
  if (planLoading) {
    return (
      <div className={className}>
        <SpaceCreatorWizardLoader message={'Finding plan...'} />
      </div>
    )
  }
  return (
    <div className={className}>
      {plan ? (
        <>
          <div className='max-w-xl text-sm leading-6'>
            <p className='my-2'>
              Before you can store data in your space on web3.storage, you need to
              set this space up for billing.
            </p>
          </div>
          {error && (
            <>
              <h3>Error setting up billing:</h3>
              <p>{error.message}</p>
            </>
          )}
          <button className='bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'
            onClick={setUpBilling} disabled={buttonDisabled}>
            Set up billing.
          </button>
        </>
      ) : (
        <>
          <div className='max-w-xl text-sm leading-6'>
            <p className='my-2'>
              Before you can set up billing for this space, you need to pick a plan. You can
              do that by opening the following link in a new tab:
            </p>
            <a className="text-blue-800" target="_blank" rel="noreferrer nofollow" href="/plans">Plan Picker Page</a>
            <p className='my-2'>
              Once you&apos;re done, hit the button below to refresh your plan information:
            </p>
          </div>
          <button className='bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'
            onClick={refreshPlan} disabled={buttonDisabled}>
            Refresh
          </button>
        </>
      )}
    </div>
  )
}

interface SpaceRecoveryFormProps {
  className?: string
  ownedSpace?: OwnedSpace,
}

export function SpaceRecoveryForm ({
  className = '',
  ownedSpace
}: SpaceRecoveryFormProps): ReactNode {
  const [{ accounts, client }] = useW3()
  const account = accounts[0]
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<Failure | undefined>()
  const [submitted, setSubmitted] = useState(false)

  const { nextStep } = useWizard()
  async function setUpRecovery () {
    if (client && ownedSpace) {
      setSubmitted(true)
      try {
        let saveSuccess;
        if (!saved) {
          const saveResult = await ownedSpace.save()
          if (saveResult.ok) {
            setSaved(true)
            saveSuccess = true
          } else {
            setError(saveResult.error)
          }
        }
        if (saved || saveSuccess) {
          const recovery = await ownedSpace.createRecovery(account.did())
          const delegateResult = await client.capability.access.delegate({
            space: ownedSpace.did(),
            delegations: [recovery]
          })
          if (delegateResult.ok) {
            nextStep()
          } else {
            setError(delegateResult.error)
          }
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setSubmitted(false)
      }
    }
  }
  const buttonDisabled = !ownedSpace
  if (submitted) {
    return (
      <div className={className}>
        <SpaceCreatorWizardLoader message={'Connecting your space to web3.storage...'} />
      </div>
    )
  }
  return (
    <div className={className}>
      <div className='max-w-xl text-sm leading-6'>
        <p className='my-2'>
          Finally, we recommend you connect this space to <b>{account.toEmail()}</b>&apos;s
          web3.storage account.
        </p>
        <p className='my-2'>
          If you choose not to do this we will not be able to
          automatically give you access to this space on other devices and we
          will not be able to help you regain access if you lose your recovery
          phrase. You can still import your space into other devices
          using your recovery phrase.
        </p>
      </div>
      {error && (
        <>
          <h3>Error delegating recovery to the service:</h3>
          <p>{error.message}</p>
        </>
      )}
      <button className='bg-zinc-950 hover:outline text-white font-bold text-sm px-6 py-2 rounded-full whitespace-nowrap'
        onClick={setUpRecovery} disabled={buttonDisabled}>
        Save This Space
      </button>
    </div>
  )
}

interface SpacePreviewProps {
  did?: SpaceDID
  name?: string
  className?: string
}

export function SpacePreview ({ did, name, className }: SpacePreviewProps) {
  if (!did) {
    return (
      <div className={className}>
        <SpaceCreatorWizardLoader message={'Loading your space...'} />
      </div>
    )
  }
  return (
    <div className={className}>
      <figure className='p-4 flex flex-row items-start gap-2 bg-zinc-950/10 hover:bg-white/10 rounded'>
        <Link href={`/space/${did}`} className='block'>
          <DidIcon did={did} />
        </Link>
        <figcaption className='grow'>
          <Link href={`/space/${did}`} className='block'>
            <span className='block text-lg font-semibold leading-5 mb-1'>
              {name ?? 'Untitled'}
            </span>
            <span className='block font-mono text-xs truncate'>
              {did}
            </span>
          </Link>
        </figcaption>
        <div>
          <Link href={`/space/${did}`} className='text-sm font-semibold align-[-8px] hover:underline'>
            View
          </Link>
        </div>
      </figure>
    </div>
  )
}

interface SpaceCreatorWizardProps {
  className?: string
}

export function SpaceCreatorWizard ({
  className = ''
}: SpaceCreatorWizardProps): ReactNode {
  const [ownedSpace, setOwnedSpace] = useState<OwnedSpace>()
  const [preferDelegateRecovery, setPreferDelegateRecovery] = useState(false)

  return (
    <Wizard>
      <SpaceCreatorForm setOwnedSpace={setOwnedSpace} className={className} />
      <SpaceMnemonicForm ownedSpace={ownedSpace} setPreferDelegateRecovery={setPreferDelegateRecovery} className={className} />
      <SpaceBillingForm spaceDID={ownedSpace?.did()} className={className} />
      <SpaceRecoveryForm ownedSpace={ownedSpace} className={className} />
      <SpacePreview did={ownedSpace?.did()} name={ownedSpace?.name} className={className} />
    </Wizard>
  )
}

interface SpaceCreatorProps {
  className?: string
}

export function SpaceCreator ({
  className = ''
}: SpaceCreatorProps): JSX.Element {
  const [creating, setCreating] = useState(false)

  return (
    <div className={`${className}`}>
      {creating
        ? (
          <SpaceCreatorWizard />
        )
        : (
          <button
            className='w3ui-button py-2'
            onClick={() => { setCreating(true) }}
          >
            Add Space
          </button>
        )}
    </div>
  )
  /* eslint-enable no-nested-ternary */
}

