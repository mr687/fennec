import makeWASocket from '@adiwajshing/baileys'

export type WhatsappBaileysSessionId = string | number

export type WhatsappBaileysConfig = {
  SESSION_PATH: string
  STORE_PATH: string
  MAX_RETRIES: number
  QR_TIMEOUT: number
  QR_PRINT_TO_TERMINAL: boolean
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
}

export type SendMessageTextDto = SessionIdDto &
  ReceiverDto & {
    message: string
  }

export type SendMessageOtpDto = ReceiverDto & {
  code: number
  sessionId: WhatsappBaileysSessionId
}

export type ResponseSendMessageDto = ReceiverDto & {
  status: boolean
  message: string
}

export type CheckPhoneNumberDto = {
  phone: string
}

export type LoginSessionDto = {
  sessionName: string
}
