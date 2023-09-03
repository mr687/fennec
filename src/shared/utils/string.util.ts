export const stringToBase64 = (str: string) => Buffer.from(str).toString('base64')

export const base64ToString = (base64: string) => Buffer.from(base64, 'base64').toString('utf-8')

export const randomString = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * charactersLength))).join('')
}

export const randomSessionId = () => randomString(32)

export const randomPassword = () => randomString(12)
