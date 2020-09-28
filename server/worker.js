import _ from './systemtranslate.js'
import { Logger, createMessenger } from '#lib'

const log = Logger('WORKER')

class Worker {
  constructor (config) {
    Object.defineProperty(this, 'config', {
      value: config
    })
    if (config.disabled === 'true') {
      Object.defineProperty(this, 'disabled', {
        value: true
      })
    }
  }

  _constructed () {
    return new Promise((resolve, reject) => {
      log.info(_('WORKER_MSG_CONSTRUCTED', { name: this.name }))
      this.#_initialize()
      this.onConstruction()

      this.#_prepareAssets().then((assets) => {
        Object.defineProperty(this, 'extAssets', {
          value: assets
        })
        resolve()
      })

      resolve()
    })
  }

  postMessage (to, message, payload, timeout) {
    return this.messenger.postMessage(to, message, payload, timeout)
  }

  _ready () {
    this.onReady()
  }

  #_initialize () {
    const callsign = 'WORKER:' + this.name
    const messenger = createMessenger(callsign)
    messenger.onMessage(this.onMessage.bind(this))
    Object.defineProperty(this, 'callsign', {
      value: callsign
    })
    Object.defineProperty(this, 'packageURL', {
      value: '/packages/' + this.name
    })
    Object.defineProperty(this, 'packagePath', {
      value: '/packages/' + this.name
    })
    Object.defineProperty(this, 'messenger', {
      value: messenger
    })
  }

  #_prepareAssets () {
    return new Promise((resolve, reject) => {
      (async () => {
        var assets = []
        var extern = [
          { name: 'injectExternJS', type: 'js' },
          { name: 'injectExternModuleJS', type: 'modulejs' },
          { name: 'injectExternCSS', type: 'css' }
        ]
        for (var { name, type } of extern) {
          if (typeof this[name] === 'function') {
            var ie = this[name]()
            if (Array.isArray(ie)) {
              for (var url of ie) {
                assets.push({
                  type: type,
                  url: url,
                  internal: false
                })
              }
            }
          }
        }
        resolve(assets)
      })()
    })
  }

  injectExternJS () { return [] }
  injectExternModuleJS () { return [] }
  injectExternCSS () { return [] }

  onConstruction () {}
  onReady () {}
  onMessage (message, payload, members, reply) {}
}

export default Worker
