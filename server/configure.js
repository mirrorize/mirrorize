import fs from 'fs'
import path from 'path'

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
      var cp = path.join(fPath, 'custom.config.js')
      var dp = path.join(fPath, 'default.config.js')

      var promises = []
      if (fs.existsSync(cp)) {
        promises.push(import(cp))
      }
      if (fs.existsSync(dp)) {
        promises.push(import(dp))
      }

      var ret = {}
      Promise.allSettled(promises).then((modules) => {
        for (var module of modules) {
          ret = mergeDeep(ret, module.value.default)
        }
        resolve(ret)
      })
    } catch (e) {
      reject(e)
    }
  })
}

export default Configure
