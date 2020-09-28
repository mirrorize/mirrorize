// import _ from './systemtranslate.js'
import { Logger, __basepath, scanAssets, createMessenger, Client } from '#lib'
import path from 'path'
import globby from 'globby'

const log = Logger('CLIENTS')

const messenger = createMessenger('CLIENTS')

class _CLIENTS {
  #config = {}
  #clients = new Map()
  #connected = new Map()
  init (config) {
    return new Promise((resolve, reject) => {
      (async () => {
        this.#config = config
        var clients = await this.#scanAllClients()
        this.#clients = new Map(Object.entries(clients))
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
      for (var [key, c] of this.#clients.entries()) {
        assets[key] = c.assets
      }
      resolve(assets)
    })
  }

  clientConnected (clientName, clientUID) {
    var client = this.#connected.get(clientUID)
    if (client) {
      client.disconnected()
    }
    this.#connected.set(clientUID, new Client(clientName, clientUID))
  }

  responseEnded (reqId) {
    var client = Array.from(this.#connected.values()).find((c) => {
      return c.sseReqId === reqId
    })
    if (client) {
      this.#connected.delete(client.clientUID)
      client.disconnected()
    }
  }

  findClient (clientUID) {
    return this.#connected.get(clientUID)
  }
}

const Clients = new _CLIENTS()
export default Clients
