export const stringToBase64 = (str: string) => Buffer.from(str).toString('base64')

export const base64ToString = (base64: string) => Buffer.from(base64, 'base64').toString('utf-8')
