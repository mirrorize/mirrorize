import { Worker, Logger } from '-lib'

const log = Logger('W:CORE')

export default class extends Worker {
  onConstruction () {
    log.log('hello')
  }
}
