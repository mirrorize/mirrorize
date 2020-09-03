import fs from 'fs'
import path from 'path'
import { Logger } from '#lib'
import _ from './systemtranslate.js'


const log = Logger('CONFIGURE')

function mergeDeep (base, over) {
  const isPlainObject = obj => obj && obj.constructor === Object && Object.getPrototypeOf(obj) === Object.prototype
  var cBase = Object.assign({}, base)
  for (var [key, value] of Object.entries(over)) {
    if (!cBase[key]) {
      cBase[key] = value
    } else {
      if (isPlainObject(value)) {
        cBase[key] = mergeDeep(cBase[key], value)
      } else {
        cBase[key] = value
      }
    }
  }
  return cBase
}

function Configure (fPath) {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const invalidConfig = (file) => {
          log.warn(_('CONFIGURE_INVALID_CONFIG_FILE', {file: file}))
          log.warn(_('CONFIGURE_INVALID_CONFIG_FILE2'))
        }
        var cp = path.join(fPath, 'custom.config.js')
        var dp = path.join(fPath, 'default.config.js')
        var cc = await import(cp).catch((e) => {
          invalidConfig(cp)
        })
        var dc = await import(dp).catch((e) => {
          invalidConfig(dp)
        })
        var ret = mergeDeep((dc?.default || {}), (cc?.default || {}))
        resolve(ret)
      })()
    } catch (e) {
      reject(e)
    }
  })
}

export default Configure
