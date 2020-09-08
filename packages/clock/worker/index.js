import { Worker, Logger } from '../../../lib/index.js'

const log = Logger('W:CLOCK')

export default class extends Worker {
  onConstruction () {
    log.log('hello')
  }
}
