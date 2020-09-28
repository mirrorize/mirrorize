// import _ from './systemtranslate.js'
import { Logger } from '#lib'
import stream from 'stream'

var log = console

class Client {
  #sse = null
  #hbTimer = null

  getReqId () {
    return this.sseReqId
  }

  constructor (clientName, clientUID) {
    Object.defineProperty(this, 'clientName', {
      value: clientName
    })
    Object.defineProperty(this, 'clientUID', {
      value: clientUID
    })
    log = Logger('C:' + clientName)
    this.stream = new stream.Readable()
    this.stream._read = function () {}
    log.log('Hello')
  }

  disconnected () {
    log.warn('This client was disconnected', this.clientName, this.clientUID)
    log.warn('CLOSED SSE', this.sseReqId)
    this.stream.destroy()
    this.stream = null
    this.#sse = null
    clearTimeout(this.#hbTimer)
    delete this
  }

  establishSSEStream (reqId) {
    Object.defineProperty(this, 'sseReqId', {
      value: reqId
    })
    // this.#heartbeat()
    return this.stream
  }

  sendMessage (event, payload) {
    var message = 'event:' + event + '\n'
    message += 'data:' + JSON.stringify(payload) + '\n\n'
    this.stream.push(message)
  }

  #heartbeat () {
    clearTimeout(this.#hbTimer)
    this.#hbTimer = setTimeout(() => {
      this.sendMessage('heartbeat', { heartbeat: Date.now() })
      this.#heartbeat()
    }, 1000)
  }
}

export default Client
