import fs from 'fs'
import path from 'path'

class _Workers {
  constructor () {
    this.config = {}
    this.workers = []
  }

  init (config, components = []) {
    return new Promise((resolve, reject) => {
      this.config = config || {}
      if (!Array.isArray(components)) {
        reject(new Error('Invalid components data'))
        return
      }
      var promises = []
      for (var { name, componentPath } of components) {
        promises.push(this.scanWorker(componentPath))
      }
      Promise.all(promises).then((workers) => {
        for (var w of workers) {
          if (w instanceof Error) {
            reject(w)
            return
          }
          if (w) { // null or undefined if worker has no explicit worker(index.js)
            Object.defineProperty(w, 'name', { value: name })
            this.workers.push(w)
          }
        }
        resolve()
      }).catch(reject)
    })
  }

  scanWorker (dPath) {
    return new Promise((resolve, reject) => {
      try {
        const wPath = path.join(dPath, 'worker', 'index.js')
        if (fs.existsSync(wPath)) {
          import(wPath).then((module) => {
            resolve(module.default)
          }).catch((e) => {
            console.warn('Invalid worker module:', wPath)
            console.error(e)
            resolve(e)
          })
        } else {
          resolve(null)
        }
      } catch (e) {
        reject(e)
      }
    })
  }
}

const Workers = new _Workers()

export default Workers
