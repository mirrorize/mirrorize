import { Worker, Logger } from '../../../lib/index.js'

const log = Logger('W:CLOCK')

export default class extends Worker {
  onConstruction () {
    log.log('hello')
  }

  onMessage (message, payload, from, to, reply) {
    console.log('MESSAGE INCOMMING', message, payload, from)
    reply({
      foo: 1,
      bar: this.name,
      baz: '1234567'
    })
  }
}
