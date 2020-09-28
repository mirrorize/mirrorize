import events from 'events'
import _ from './systemtranslate.js'
import { Logger } from '#lib'

const log = Logger('MESSENGER')

const messengers = new Set()

class _Messenger {
  #callsign = ''
  #event = null
  #onMessageF = null
  constructor (callsign) {
    if (!callsign.trim()) {
      throw new Error(_('MESSENGER_NO_CALLSIGN'))
    }
    this.#callsign = callsign
    this.#event = new events.EventEmitter()
    this.#event.on('MESSAGE', (mObj, reply = () => {}) => {
      if (typeof this.#onMessageF === 'function') {
        const waitForReply = () => {
          return new Promise((resolve, reject) => {
            var timedout = false
            var timer = null
            var {
              _message = 'DEFAULT_MESSAGE',
              _payload = null,
              _from,
              _callsign,
              _timeout
            } = mObj
            const replyMe = (answer) => {
              if (!timedout) {
                clearTimeout(timer)
                timer = null
                resolve({
                  result: answer,
                  from: this.#callsign
                })
              }
            }
            this.#onMessageF(_message, _payload, _from, _callsign, replyMe)
            if (_timeout) {
              timer = setTimeout(() => {
                timedout = true
                clearTimeout(timer)
                timer = null
                resolve({
                  result: new Error('ERR_TIMEOUT_REPLY'),
                  from: this.#callsign
                })
              }, _timeout)
            }
          })
        }
        reply(waitForReply())
      } else {
        const error = new Error('MESSENGER_NO_HANDLER')
        reply(error)
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

  postMessage (target, message, payload, timeout = 0) {
    return new Promise((resolve, reject) => {
      try {
        var targets = (target === '*') ? [...messengers] : [...messengers].filter((m) => {
          return (m.callsign.indexOf(target) === 0)
        })
        var promises = []
        for (var t of targets) {
          var mObj = {
            _from: this.#callsign,
            _message: message || 'DEFAULT_MESSAGE',
            _payload: payload,
            _callsign: target,
            _timeout: timeout || 0
          }
          const reply = (result) => {
            promises.push(result)
          }
          t.event.emit('MESSAGE', mObj, reply)
        }
        Promise.all(promises).then((aResult) => {
          var ret = []
          for (var r of aResult) {
            ret.push(r)
          }
          resolve(ret)
        }).catch(reject)
      } catch (e) {
        reject(e)
      }
    })
  }

  onMessage (callback) {
    this.#onMessageF = callback
  }

  destroy () {
    messengers.delete(this)
    this.#callsign = ''
    this.#onMessageF = null
    this.#event = null
    delete this
  }
}

function createMessenger (callsign) {
  return _Messenger.factory(callsign)
}

export default createMessenger
