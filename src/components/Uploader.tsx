import type {
  OnUploadComplete,
  ProgressStatus,
  UploadProgress,
  CARMetadata,
  AnyLink
} from '@w3ui/react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  UploadStatus,
  Uploader as W3Uploader,
  WrapInDirectoryCheckbox,
  useUploader
} from '@w3ui/react'
import { gatewayHost } from '../components/services'
import { ChangeEvent, useCallback, useState } from 'react'
import { RadioGroup } from '@headlessui/react'

function StatusLoader ({ progressStatus }: { progressStatus: ProgressStatus }) {
  const { total, loaded, lengthComputable } = progressStatus
  if (lengthComputable) {
    const percentComplete = Math.floor((loaded / total) * 100)
    return (
      <div className='relative w-80 h-4 border border-solid border-white'>
        <div className='bg-white h-full' style={{ width: `${percentComplete}%` }}>
        </div>
      </div>
    )
  } else {
    return <ArrowPathIcon className='animate-spin h-4 w-4' />
  }
}

function Loader ({ uploadProgress }: { uploadProgress: UploadProgress }): JSX.Element {
  return (
    <div className='flex flex-col'>
      {Object.values(uploadProgress).map(
        status => <StatusLoader progressStatus={status} key={status.url} />
      )}
    </div>
  )
}

export const Uploading = ({
  file,
  storedDAGShards,
  uploadProgress
}: {
  file?: File
  storedDAGShards?: CARMetadata[]
  uploadProgress: UploadProgress
}): JSX.Element => (
  <div className='flex flex-col items-center w-full'>
    <h1 className='font-bold text-sm uppercase text-zinc-950'>Uploading {file?.name}</h1>
    <Loader uploadProgress={uploadProgress} />
    {storedDAGShards?.map(({ cid, size }) => (
      <p className='text-xs max-w-full overflow-hidden text-ellipsis' key={cid.toString()}>
        shard {cid.toString()} ({humanFileSize(size)}) uploaded
      </p>
    ))}
  </div>
)

export const Errored = ({ error }: { error: any }): JSX.Element => (
  <div className='flex flex-col items-center'>
    <h1>
      ⚠️ Error: failed to upload file: {error.message}
    </h1>
    <p>Check the browser console for details.</p>
  </div>
)

interface DoneProps {
  file?: File
  dataCID?: AnyLink
  storedDAGShards?: CARMetadata[]
}

export const Done = ({ dataCID }: DoneProps): JSX.Element => {
  const [, { setFile }] = useUploader()
  const cid: string = dataCID?.toString() ?? ''
  return (
    <div className='flex flex-col items-center w-full'>
      <h1 className='font-bold text-sm uppercase text-zinc-950 mb-1 '>Uploaded</h1>
      <a
        className='font-mono text-xs max-w-full overflow-hidden no-wrap text-ellipsis'
        href={`https://${cid}.ipfs.${gatewayHost}/`}
      >
        {cid}
      </a>
      <div className='p-4'>
        <button
          className='w3ui-button'
          onClick={() => {
            setFile(undefined)
          }}
        >
          Add More
        </button>
      </div>
    </div>
  )
}

enum UploadType {
  File = 'File',
  Directory = 'Directory',
  CAR = 'CAR'
}

function uploadPrompt (uploadType: UploadType) {
  switch (uploadType) {
    case UploadType.File: {
      return 'Drag File or Click to Browse'
    }
    case UploadType.Directory: {
      return 'Drag Directory or Click to Browse'
    }
    case UploadType.CAR: {
      return 'Drag CAR or Click to Browse'
    }
  }
}

const UploaderForm = (): JSX.Element => {
  const [{ file }, { setUploadAsCAR }] = useUploader()
  const [allowDirectory, setAllowDirectory] = useState(false)
  const [uploadType, setUploadType] = useState(UploadType.File)
  function changeUploadType (type: UploadType) {
    if (type === UploadType.File) {
      setUploadAsCAR(false)
      setAllowDirectory(false)
    } else if (type === UploadType.Directory) {
      setUploadAsCAR(false)
      setAllowDirectory(true)
    } else if (type === UploadType.CAR) {
      setUploadAsCAR(true)
      setAllowDirectory(false)
    }
    setUploadType(type)
  }
  const hasFile = file !== undefined
  return (
    <>
      <W3Uploader.Form>
        <RadioGroup value={uploadType} onChange={changeUploadType} className='flex flex-row items-center text-center my-2'>
          <RadioGroup.Option value={UploadType.File}>
            {({ checked }) => (
              <div className={`${checked ? 'bg-blue-200' : ''} w-24 border p-2 rounded-l`}>File</div>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option value={UploadType.Directory}>
            {({ checked }) => (
              <div className={`${checked ? 'bg-blue-200' : ''} w-24 border p-2`}>Directory</div>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option value={UploadType.CAR}>
            {({ checked }) => (
              <div className={`${checked ? 'bg-blue-200' : ''} w-24 border p-2 rounded-r`}>CAR</div>
            )}
          </RadioGroup.Option>
        </RadioGroup>
        {uploadType === UploadType.File && (
          <label className='flex flex-row items-center mb-1'>
            <WrapInDirectoryCheckbox />
            <span className='text-sm ml-1'>Wrap In Directory</span>
          </label>
        )}
        <div className={`relative shadow h-52 p-8 rounded-md bg-white/5 hover:bg-white/20 border-2 border-dotted border-zinc-950 flex flex-col justify-center items-center text-center`}>
          {hasFile ? '' : <span className='mb-5'><img src='/icon-tray.svg' /></span>}
          <label className={`${hasFile ? 'hidden' : 'block h-px w-px overflow-hidden absolute whitespace-nowrap'}`}>File:</label>
          <W3Uploader.Input className={`${hasFile ? 'hidden' : 'block absolute inset-0 cursor-pointer w-full opacity-0'}`} allowDirectory={allowDirectory} />
          <UploaderContents />
          {hasFile ? '' : <span>{uploadPrompt(uploadType)}</span>}
        </div>
      </W3Uploader.Form>
      <div className='flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 mt-4 text-center lg:text-left'>
        <div className=''>
          <h4 className='text-sm mb-2'>🌎&nbsp;&nbsp;Public Data</h4>
          <p className='text-xs'>
            All data uploaded to w3up is available to anyone who requests it using the correct CID.
            Do not store any private or sensitive information in an unencrypted form using w3up.
          </p>
        </div>
        <div className=''>
          <h4 className='text-sm mb-2'>♾️&nbsp;&nbsp;Permanent Data</h4>
          <p className='text-xs'>
            Removing files from w3up will remove them from the file listing for your account, but that
            doesn’t prevent nodes on the decentralized storage network from retaining copies of the data
            indefinitely. Do not use w3up for data that may need to be permanently deleted in the future.
          </p>
        </div>
      </div>
    </>
  )
}

function pickFileIconLabel (file: File): string | undefined {
  const type = file.type.split('/')
  if (type.length === 0 || type.at(0) === '') {
    const ext = file.name.split('.').at(-1)
    if (ext !== undefined && ext.length < 5) {
      return ext
    }
    return 'Data'
  }
  if (type.at(0) === 'image') {
    return type.at(-1)
  }
  return type.at(0)
}

function humanFileSize (bytes: number): string {
  const size = (bytes / (1024 * 1024)).toFixed(2)
  return `${size} MiB`
}

const UploaderContents = (): JSX.Element => {
  const [{ status, file }] = useUploader()
  const hasFile = file !== undefined
  if (status === UploadStatus.Idle) {
    return hasFile
      ? (
        <>
          <div className='flex flex-row'>
            <div className='w-12 h-12 py-0.5 flex flex-col justify-center items-center bg-black text-xs uppercase text-center text-ellipsis rounded-xs mr-3' title={file.type}>
              {pickFileIconLabel(file)}
            </div>
            <div className='flex flex-col justify-around'>
              <span className='text-sm'>{file.name}</span>
              <span className='text-xs text-white/75 font-mono'>
                {humanFileSize(file.size)}
              </span>
            </div>
          </div>
          <div className='p-4'>
            <button
              type='submit'
              className='w3ui-button'
              disabled={file === undefined}
            >
              Upload
            </button>
          </div>
        </>
      )
      : <></>
  } else {
    return (
      <>
        <UploaderConsole />
      </>
    )
  }
}

const UploaderConsole = (): JSX.Element => {
  const [{ status, file, error, dataCID, storedDAGShards, uploadProgress }] =
    useUploader()

  switch (status) {
    case UploadStatus.Uploading: {
      return <Uploading file={file} storedDAGShards={storedDAGShards} uploadProgress={uploadProgress} />
    }
    case UploadStatus.Succeeded: {
      return (
        <Done file={file} dataCID={dataCID} storedDAGShards={storedDAGShards} />
      )
    }
    case UploadStatus.Failed: {
      return <Errored error={error} />
    }
    default: {
      return <></>
    }
  }
}

export interface SimpleUploaderProps {
  onUploadComplete?: OnUploadComplete
}

export const Uploader = ({
  onUploadComplete
}: SimpleUploaderProps): JSX.Element => {
  return (
    <W3Uploader
      as='div'
      onUploadComplete={onUploadComplete}
      defaultWrapInDirectory={true}
    >
      <UploaderForm />
    </W3Uploader>
  )
}
