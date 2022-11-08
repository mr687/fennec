import { Callback } from '../types'

export const delay = (ms: number): Promise<never> => {
  if (ms < 0) {
    ms = 1
  }
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const delayWithCallback = async <T extends Callback>(
  ms: number,
  cb: T,
): Promise<ReturnType<T>> => {
  await delay(ms)
  return cb()
}
