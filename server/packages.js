import fs from 'fs'
import path from 'path'
import _ from './systemtranslate.js'
import { Configure, Logger } from '#lib'
import scanAssets from './asset.js'

const log = Logger('PACKAGES')
log.log(_('PACKAGES_IS_LOADING'))

class _Packages {
  #config = {}
  #packages = new Map()

  init (config = {}, dPath) {
    this.#config = config
    return new Promise((resolve, reject) => {
      if (fs.existsSync(dPath)) {
        var packages = this.#scanPackages(dPath)
        var promises = []
        for (const a of packages) {
          var pPath = path.join(dPath, a)
          promises.push(this.#readPackages(pPath))
        }
        Promise.allSettled(promises).then((ra) => {
          for (var r of ra) {
            if (!r) continue
            this.#packages.set(r.value?.name, r.value)
          }
          resolve()
        }).catch((e) => {
          log.warn(e.message)
          log.error(e)
        })
      } else {
        var e = new Error(_('PACKAGES_INVALID_PKG_DIR', { dir: dPath }))
        reject(e)
      }
    })
  }

  #readPackages (pPath) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          if (!fs.existsSync(pPath)) resolve(null)
          var wPath = path.join(pPath, 'worker')
          var aPath = path.join(pPath, 'assets')
          Configure(wPath).then(async (config) => {
            const name = pPath.split('/').pop()
            var assets = await scanAssets(aPath, (_path) => {
              return path.join('/_/assets', name, _path)
            })
            var p = {
              name: name,
              disabled: (config?.disabled) || false,
              packagePath: pPath,
              workerPath: wPath,
              // assetPath: aPath,
              worker: 'index.js',
              // templates: this.#scanTemplates(aPath),
              // css: this.#scanCss(aPath),
              // elements: [],
              // js: this.#scanJs(aPath),
              workerConfig: config,
              assets: assets
            }
            resolve(p)
          }).catch((e) => {
            log.warn(e.message)
            log.warn(_('PACKAGES_INVALID_CONFIG', { file: wPath }))
            resolve(null)
          })
        } catch (e) {
          reject(e)
        }
      })()
    })
  }

  /*
  #scanTemplates (pPath) {
    if (!fs.existsSync(pPath)) return []
    var tPath = path.join(pPath, 'templates')
    if (!fs.existsSync(tPath)) return []
    return this.#scanFiles(tPath, 'html')
  }

  #scanCss (pPath) {
    if (!fs.existsSync(pPath)) return []
    var tPath = path.join(pPath, 'css')
    if (!fs.existsSync(tPath)) return []
    return this.#scanFiles(tPath, 'css')
  }

  #scanJs (pPath) {
    if (!fs.existsSync(pPath)) return []
    var tPath = path.join(pPath, 'js')
    if (!fs.existsSync(tPath)) return []
    return this.#scanFiles(tPath, 'js')
  }

  #scanFiles (xPath, ext = null) {
    return fs.readdirSync(xPath, { withFileTypes: true })
      .filter((dirent) => {
        return dirent.isFile()
      })
      .filter((dirent) => {
        if (ext) {
          return (dirent.name.split('.').pop()) === ext
        }
        return true
      })
      .map((dirent) => {
        return dirent.name
      })
  }
*/
  #scanPackages (dPath) {
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

  /**
   * packageInfo
   * @typedef {Object} packageInfo
   * @property {string} name
   * @property {boolean} disabled
   * @property {string} packagePath
   * @property {string} workerPath
   * @property {string} assetPath
   * @property {string} worker
   * @property {Array<string>} templates
   * @property {Array<string>} css
   * @property {Array<string>} js
   * @property {Array<string>} elements
   * @property {Object} workderConfig
   * @property {Array<Object>} assets
   */

  /**
   * return map of all packages (even inactive)
   * @public
   * @return {Map<name, packageInfo>}
   */
  getPackages () {
    return new Map(this.#packages)
  }

  /**
   * return map of active packages
   * @public
   * @return {Map<name, packageInfo>}
   */
  getActivePackages () {
    var ret = new Map()
    for (const [key, value] of this.#packages) {
      if (!value?.disabled) ret.set(key, value)
    }
    return ret
  }

  getActiveAssets () {
    var assets = []
    var itr = this.getActivePackages()
    for (const pkg of itr.values()) {
      assets = [...assets, ...pkg.assets]
    }
    return assets
  }
}

const Packages = new _Packages()

export default Packages
