import type { IncomingMessage } from 'http'

import { base64ToString } from './string.util'

export const parseAuthorizationHeader = (request: IncomingMessage) => {
  const authorizationHeader = request.headers.authorization

  return authorizationHeader
}

export const parseBearerTokenFromRequestHeader = (request: IncomingMessage): string | undefined => {
  const authorizationHeader = parseAuthorizationHeader(request)
  const bearerToken = authorizationHeader?.replace(/bearer\s/i, '')

  return bearerToken ?? undefined
}

export const parseBasicTokenFromRequestHeader = (
  request: IncomingMessage,
): { username: string; password: string } | undefined => {
  const authorizationHeader = parseAuthorizationHeader(request)
  const basicTokenEncoded = authorizationHeader?.replace(/basic\s/i, '')
  const basicToken = basicTokenEncoded ? base64ToString(basicTokenEncoded) : undefined

  if (!basicToken) {
    return
  }

  const [username, password] = basicToken.split(':')
  return { username, password }
}
