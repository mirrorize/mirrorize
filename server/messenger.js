import events from 'events'
import _ from './systemtranslate.js'
import { Logger } from '#lib'
import log from 'loglevel'

const messengers = new Set()

class _Messenger {
  #callsign = ''
  #event = null
  #onMessage = null
  constructor (callsign) {
    if (!callsign.trim()) {
      throw new Error(_('MESSENGER_NO_CALLSIGN'))
      return null
    }
    this.#callsign = callsign
    this.#event = new events.EventEmitter()
    this.#event.on('MESSAGE', (mObj) => {
      if (typeof this.#onMessage === 'function') {
        var {
          _message = 'DEFAULT_MESSAGE',
          _payload = null,
          _from,
          _callsign,
          _reply
        } = mObj
        var reply = (typeof _reply === 'function')
          ? (result) => {
              _reply(result, this.#callsign)
            }
          : null
        this.#onMessage(_message, _payload, _from, _callsign, reply)
      }
    })
    messengers.add(this)
  }

  static factory (callsign) {
    try {
      var m = new _Messenger(callsign)
      return m
    } catch (e) {
      return e
    }
  }

  get callsign () {
    return this.#callsign
  }

  get event () {
    return this.#event
  }

  postMessage (target, message, payload, reply = (result, from) => {}) {
    var targets = (target === '*') ? [...messengers] : [...messengers].filter((m) => {
      return (m.callsign.indexOf(target) === 0)
    })
    for (var t of targets) {
      var mObj = {
        _from: this.#callsign,
        _message: message || 'DEFAULT_MESSAGE',
        _payload: payload,
        _callsign: target,
        _reply: reply
      }
      t.event.emit('MESSAGE', mObj)
    }
  }

  onMessage (callback = (message, payload, from, callsign, reply = (result, from) => {}) => {}) {
    this.#onMessage = callback
  }

  destroy() {
    messengers.delete(this)
    this.#callsign = ''
    this.#onMessage = null
    this.#event = null
    delete this
  }
}



function createMessenger (callsign) {
  return _Messenger.factory(callsign)
}


export default createMessenger

// var myMessageHandler = function (message, payload, from, reply) {
//  reply('this is result')
// }
// var myMessenger = createMessenger('myCallsign')
// myMessenger.postMessage('targetX', 'hello', payload, reply=(result, from) => {
//   console.log(result) 
// })
// myMessenger.onMessage(myMessageHandler)
