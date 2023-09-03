import { Contact } from '@whiskeysockets/baileys'
import { isUndefined } from 'lodash'

import { IWhatsappBaileysSession, WhatsappBaileysSessionStatus, WhatsappBaileysSocket } from './whatsapp-baileys.dto'

export class WhatsappBaileysSession implements IWhatsappBaileysSession {
  public socket: WhatsappBaileysSocket
  public isNew?: boolean
  public id: string
  public connected?: boolean
  public status?: WhatsappBaileysSessionStatus
  public user?: Contact
  public qr?: { type: 'base64'; data: string }

  public constructor(data: IWhatsappBaileysSession) {
    this.syncData(data)
  }

  public syncData(data: IWhatsappBaileysSession) {
    const { socket, isNew, connected, status, id, qr, user } = data
    this.socket = socket
    this.id = id

    if (!isUndefined(isNew)) {
      this.isNew = isNew
    }

    if (!isUndefined(connected)) {
      this.connected = connected
    }

    if (!isUndefined(status)) {
      this.status = status
    }

    if (!isUndefined(qr)) {
      this.qr = qr
    }

    if (!isUndefined(user)) {
      this.user = user
    }
  }
}
