import _ from './systemtranslate.js'
import { Logger } from '#lib'

const log = Logger('WORKER')

class Worker {
  constructor (config) {
    this.config = config
  }

  _constructed() {
    log.info(_('WORKER_MSG_CONSTRUCTED', { name: this.name }))
    this.onConstruction()
  }

  onConstruction() {}
}

export default Worker