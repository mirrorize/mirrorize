import { Worker, Logger } from '../../../lib/index.js'

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
      this.postMessage('WORKER:core', 'MeSsAgE', { oops: 123 }, 100000).then((result) => {
        console.log('replied', result)
      })
    }, 1000)
  }

  onMessage (message, payload, from, to, reply) {
    setTimeout(() => {
      reply({
        foo: 1,
        bar: this.name
      })
    }, 2000)
  }
}
