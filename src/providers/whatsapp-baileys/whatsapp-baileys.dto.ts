import makeWASocket, { Contact } from '@whiskeysockets/baileys'

export type WhatsappBaileysSessionId = string
export type WhatsappBaileysConfig = {
  SESSION_PATH: string
  STORE_PATH: string
  MAX_RETRIES: number
  QR_PRINT_TO_TERMINAL: boolean
  QR_TIMEOUT: number
  RECONNECT_INTERVAL: number
}

export enum WhatsappBaileysSessionStatus {
  READY = 'READY',
  SCAN_QR = 'SCAN_QR',

  SESSION_LOGGED_OUT_ERROR = 'SESSION_LOGGED_OUT_ERROR',
}

export enum WhatsappBaileysError {
  SESSION_END_ERROR = 555,

  PHONE_NUMBER_NOT_EXISTS_ERROR = 'PHONE_NUMBER_NOT_EXISTS_ERROR',
  NO_SESSION_ERROR = 'NO_SESSION_ERROR',
}

export type ReceiverDto = {
  receiver: string
}

export type SessionIdDto = {
  sessionId: WhatsappBaileysSessionId
}

export type WhatsappBaileysSocket = ReturnType<typeof makeWASocket>
export interface IWhatsappBaileysSession {
  socket: WhatsappBaileysSocket
  isNew?: boolean
  id: WhatsappBaileysSessionId
  connected?: boolean
  status?: WhatsappBaileysSessionStatus
  user?: Contact | undefined
  qr?: {
    type: 'base64'
    data: string
  }
}

export type SendMessageTextDto = SessionIdDto &
  ReceiverDto & {
    content: string
  }

export type SendMessageOtpDto = ReceiverDto & {
  code: number
  sessionId: WhatsappBaileysSessionId
}

export type ResponseSendMessageDto = ReceiverDto & {
  status: boolean
  message: string
  errorCode?: any
}

export type CheckPhoneNumberDto = {
  phone: string
}

export type LoginSessionDto = {
  sessionId: string
}
