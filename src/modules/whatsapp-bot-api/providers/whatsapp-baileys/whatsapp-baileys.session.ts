import { IWhatsappBaileysSession, WhatsappBaileysSocket } from './whatsapp-baileys.dto'
import { isUndefined } from 'lodash'

export class WhatsappBaileysSession implements IWhatsappBaileysSession {
  public socket: WhatsappBaileysSocket
  public isNew?: boolean

  public constructor(data: IWhatsappBaileysSession) {
    this.syncData(data)
  }

  public syncData(data: IWhatsappBaileysSession) {
    const { socket, isNew } = data
    this.socket = socket
    if (!isUndefined(isNew)) {
      this.isNew = isNew
    }
  }
}
