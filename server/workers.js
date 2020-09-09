import fs from 'fs'
import path from 'path'
import _ from './systemtranslate.js'
import { Logger } from '#lib'

const log = Logger('WORKERS')
log.log(_('WORKERS_LOADED'))

// import Worker from './worker.js'

class _Workers {
  #config = {}
  #workers = []

  init (config, packages) {
    return new Promise((resolve, reject) => {
      this.#config = config || {}
      if (!(packages instanceof Map)) {
        reject(new Error(_('WORKERS_INVALID_PKG_DATA')))
        return
      }

      (async () => {
        for (var [name, pkg] of packages) {
          const workerPath = path.join(pkg.workerPath, 'index.js')
          if (!fs.existsSync(workerPath)) continue
          var module = await import(workerPath).catch(reject)
          var Klass = module.default
          var worker = new Klass(pkg.workerConfig)
          Object.defineProperty(worker, 'name', { value: name })
          await worker._constructed()
          this.#workers.push(worker)
        }
        resolve()
      })()
    })
  }

  ready () {
    return new Promise((resolve, reject) => {
      this.getActiveWorkers().forEach((worker) => {
        worker._ready()
      })
    })
  }

  getActiveWorkers () {
    return this.#workers.filter((a) => {
      return !(a.disabled)
    })
  }

  getActiveAssets () {
    var r = []
    r = this.getActiveWorkers().reduce((result, a) => {
      result = [...result, ...a.assets]
      return result
    }, r)
    return r
  }
}

const Workers = new _Workers()

export default Workers
