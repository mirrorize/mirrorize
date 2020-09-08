import _ from './systemtranslate.js'
import { Logger, __basepath, createMessenger } from '#lib'
import path from 'path'
import fs from 'fs'
import mime from 'mime'
import globby from 'globby'
import etag from 'etag'

const log = Logger('WORKER')

class Worker {
  constructor (config) {
    Object.defineProperty(this, 'config', {
      value: config
    })
    if (config.disabled === 'true') Object.defineProperty(this, 'disabled', {
      value: true
    })
    
  }

  _constructed () {
    return new Promise((resolve, reject) => {
      log.info(_('WORKER_MSG_CONSTRUCTED', { name: this.name }))
      this.#_initialize()
      this.onConstruction()
      this.#_prepareAssets().then((assets) => {
        Object.defineProperty(this, 'assets', {
          value: assets
        })
        resolve()
      })
    })
  }

  postMessage (to, message, payload, reply = () => {}) {
    this.messenger.postMessage(to, message, payload, reply)
  }

  _ready () {
    this.onReady()
  }

  #_initialize() {
    const messenger = createMessenger('WORKER:' + this.name)
    messenger.onMessage(this.onMessage.bind(this))
    Object.defineProperty(this, 'packageURL', {
      value: '/packages/' + this.name
    })
    Object.defineProperty(this, 'packagePath', {
      value: '/packages/' + this.name
    })
    Object.defineProperty(this, 'messenger', {
      value: messenger
    })
  }

  
  #_prepareAssets () {
    return new Promise(async (resolve, reject) => {
      var assets = []
      var aPath = path.join('./', this.packagePath, 'assets')
      var aURL = path.join('/_/assets', this.name)
      var files = await globby(aPath + '/**/*', {
        objectMode: true,
        onlyFiles: true,
      })

      for (const file of files) {
        var { name, path: fPath} = file
        var d = fPath.split('/').slice(2)
        var isAsset = d.shift()
        var dir = d.shift()
        d.unshift(dir)
        if (d.length <= 0) dir = ''
        var remain = d.join('/')
        var rPath = path.join(__basepath, this.packagePath, 'assets', remain)
        var stat = fs.lstatSync(rPath)
        assets.push({
          type: (dir) ? dir : null,
          url: path.join('/_/assets', this.name, remain),
          internal: true,
          contentLength: stat.size,
          lastModified: stat.mtime.toUTCString(),
          contentType: mime.getType(name),
          filePath: rPath,
          etag: etag(stat)
        })
      }

      var extern = [
        { name: 'injectExternJS', type: 'js'},
        { name: 'injectExternModuleJS', type: 'modulejs'},
        { name: 'injectExternCSS', type: 'css'}
      ]
      for (var { name, type } of extern) {
        if (typeof this[name] === 'function') {
          var ie = this[name]()
          if (Array.isArray(ie)) {
            for (var url of ie) {
              assets.push({
                type: type,
                url: url,
                internal: false,
              })
            }
          }
        }
      }
      resolve(assets)
    })
  }

  injectExternJS () { return [] }
  injectExternModuleJS () { return [] }
  injectExternCSS () { return [] } 

  onConstruction() {}
  onReady() {}
  onMessage(callback = ()=>{}) {}
}

export default Worker