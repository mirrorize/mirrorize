import { Worker, Logger, createMessenger } from '../../../lib/index.js'

const log = Logger('W:CORE')

export default class extends Worker {
  onConstruction () {
    log.log('hello')
  }

  injectExternCSS () {
    return [
     // "https://example.com/test/abc.css"
    ]
  }

  onReady () {
    setTimeout(() => {
      console.log('posting!')
      this.postMessage('WORKER', 'MeSsAgE', { oops: 123 })
    }, 1000)
  }
  onMessage (message, payload, from, callsign, reply) {
    console.log('ONMESSAGE')
    console.log(message, payload, from)
    reply({
      foo: 1,
      bar: this.name
    })
  }
}
