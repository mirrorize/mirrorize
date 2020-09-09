// import _ from './systemtranslate.js'
import { Logger, __basepath, scanAssets } from '#lib'
import path from 'path'
import globby from 'globby'

const log = Logger('CLIENTS')
log.log('test')

class _CLIENTS {
  #config = {}
  #clients = {}
  #connected = []
  init (config) {
    return new Promise((resolve, reject) => {
      (async () => {
        this.#config = config
        this.#clients = await this.#scanAllClients()
        resolve()
      })()
    })
  }

  #scanAllClients () {
    return new Promise((resolve, reject) => {
      (async () => {
        var retClients = {}
        var clientsPath = path.join(__basepath, 'clients')
        var clients = await globby('**', {
          onlyDirectories: true,
          deep: 1,
          cwd: clientsPath
        })
        for (var c of clients) {
          var cPath = path.join(clientsPath, c)
          var assets = await scanAssets(cPath, (fPath) => {
            return path.join('/_/clients', c, fPath)
          })
          var clientObj = {
            name: c,
            clientPath: cPath,
            url: path.join('/_/clients/', c),
            assets: assets
          }

          retClients[c] = clientObj
        }
        resolve(retClients)
      })()
    })
  }

  getAssets () {
    return new Promise((resolve, reject) => {
      var assets = {}
      for (var [key, c] of Object.entries(this.#clients)) {
        assets[key] = c.assets
      }
      resolve(assets)
    })
  }
}

const Clients = new _CLIENTS()
export default Clients
