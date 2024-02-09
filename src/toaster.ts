import { Result } from '@ucanto/interface'
import { toast } from 'react-hot-toast'

export const ucantoast = async (promise: Promise<Result>, options: any) => {
  return toast.promise(new Promise(async (resolve, reject) => {
    promise.then((result) => {
      if (result.ok) {
        resolve(result.ok)
      } else {
        console.error("toaster got a Ucanto error: ", result.error)
        resolve(result.error)
      }
    })

    promise.catch((err: unknown) => {
      console.error("toaster caught an error: ", err)
      reject(err)
    })
  }), options)
}
