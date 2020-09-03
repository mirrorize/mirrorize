import fs from 'fs'
import path from 'path'
import _ from './systemtranslate.js'
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

      (async() => {
        for (var [name, pkg] of packages) {
          const workerPath = path.join(pkg.workerPath, 'index.js')
          if (!fs.existsSync(workerPath)) continue
          var module = await import(workerPath).catch(reject)
          var Klass = module.default
          var worker = new Klass(pkg.workerConfig)
          Object.defineProperty(worker, 'name', { value: name })
          worker._constructed()
          this.#workers.push(worker)
        }
        resolve()
      })()
    })
  }
}

const Workers = new _Workers()

export default Workers
