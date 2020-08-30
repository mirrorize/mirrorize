import fs from 'fs'
import path from 'path'

class _Components {
  constructor () {
    this.config = {}
    this.components = []
  }

  init (config = {}, dPath) {
    return new Promise((resolve, reject) => {
      this.config = config
      if (fs.existsSync(dPath)) {
        var components = this.scanAllComponents(dPath)
        for (const a of components) {
          this.components.push({
            name: a,
            componentPath: path.join(dPath, a)
          })
        }
      } else {
        var e = new Error('Invalid components directory.')
        reject(e)
        return
      }
      resolve()
    })
  }

  scanAllComponents (dPath) {
    return fs.readdirSync(dPath, { withFileTypes: true })
      .filter((dirent) => {
        return dirent.isDirectory()
      })
      .map((dirent) => {
        return dirent.name
      })
      .filter((name) => {
        return /^[a-z0-9A-Z]/i.test(name)
      })
  }

  getComponents () {
    return this.components
  }
}

const Components = new _Components()

export default Components
