import _ from './systemtranslate.js'
import { Clients, Packages, Logger, Workers, scanAssets, __basepath, createMessenger } from '#lib'
import fs from 'fs'
import path from 'path'
import fastify from 'fastify'
import fastifyStatic from 'fastify-static'

const log = Logger('WEBSERVER')

const __basename = path.resolve()

class _Webserver {
  #config = {}
  #app = null
  #assetHTML = ''
  #http2 = true
  #mainAssets = []
  #clientAssets = {}
  #packageAssets = []
  #messenger = createMessenger('WEBSERVER')
  init (config = {}) {
    return new Promise((resolve, reject) => {
      (async () => {
        this.#config = config.webserver
        this.#mainAssets = await this.#prepareAssets()
        this.#packageAssets = await this.#preparePackageAssets()
        this.#clientAssets = await this.#prepareClientAssets()

        var r = this.#initServer(this.#config)
        if (r instanceof Error) {
          reject(r)
          return
        }
        resolve()
      })()
    })
  }

  #renderIndex (client) {
    if (this.#assetHTML) return this.#assetHTML
    const dress = (assets) => {
      var text = ''
      for (var a of assets) {
        switch (a.type) {
          case 'js':
            text += `<script src="${a.url}" type="application/javascript"></script>\n`
            break
          case 'css':
            text += `<link rel="stylesheet" href="${a.url}"></link>\n`
            break
          case 'modulejs':
            text += `<link href="${a.url}" rel="modulepreload">`
        }
      }
      return text
    }
    var assets = [...this.#mainAssets, ...this.#packageAssets, ...this.#clientAssets[client]]
    var result = dress(assets)
    var hPath = path.join(__basename, 'client', 'index.html')
    var html = fs.readFileSync(hPath, { encoding: 'UTF-8' })
    html = html.replace('{{ASSETS}}', result)

    const templateAssets = assets.reduce((result, asset) => {
      if (asset.type === 'templates') {
        result.push(asset.url)
      }
      return result
    }, [])

    const elementAssets = assets.reduce((result, asset) => {
      if (asset.type === 'elements') {
        result.push(asset.url)
      }
      return result
    }, [])
    const moduleAssets = assets.reduce((result, asset) => {
      if (asset.type === 'modulejs') {
        result.push(asset.url)
      }
      return result
    }, [])
    var conf = {
      useExperimentalClientCache: this.#config.useExperimentalClientCache || false,
      templateAssets: templateAssets,
      elementAssets: elementAssets,
      moduleAssets: moduleAssets
    }

    var scr = `const initValues = ${JSON.stringify(conf, null, 2)}`
    html = html.replace('{{INIT}}', scr)
    this.#assetHTML = html
    return html
  }

  #initServer (config) {
    this.#http2 = config.useHTTP2
    var opts = {
      http2: config.useHTTP2
    }
    if (config.useHTTP2 === true) {
      const key = config?.key || 'http2cert/localhost+2-key.pem'
      const cert = config?.certificate || 'http2cert/localhost+2.pem'
      var kp = path.join(__basename, key)
      var cp = path.join(__basename, cert)
      if (!fs.existsSync(kp) || !fs.existsSync(cp)) {
        const e = new Error(_('WEBSERVER_INVALID_CERT'))
        return e
      }
      opts.https = {
        key: fs.readFileSync(kp),
        cert: fs.readFileSync(cp)
      }
    }
    opts = Object.assign({}, opts, config.fastifyOptions)

    /* // Log beautifying someday...
    var ffLog = Logger('WS:FASTIFY')
    ffLog.fatal = (msg) => { console.log('oops', msg) }
    ffLog.child = () => { return Logger('WS:FASTIFY') }
    if (opts.logger === true) opts.logger = ffLog
    */
    var app = fastify(opts)

    app.addHook('onResponse', (req, reply, done) => {
      Clients.responseEnded(req.id)
      done()
    })

    const workers = Workers.getActiveWorkers()
    for (var w of workers) {
      var aPath = path.join(__basename, w.packagePath, 'assets')
      if (!fs.existsSync(aPath)) continue
      app.register(fastifyStatic, {
        root: path.join(aPath),
        prefix: '/_/assets/' + w.name,
        decorateReply: false
      })
    }
    ['node_modules', 'translations', 'shared', 'resources', 'clients'].forEach((dir) => {
      app.register(fastifyStatic, {
        root: path.join(__basename, dir),
        prefix: path.join('/_/', dir),
        decorateReply: false
      })
    })
    app.register(fastifyStatic, {
      root: path.join(__basename, 'client'),
      prefix: '/',
      decorateReply: false
    })

    /*

    app.register(fastifySession, {
      secret: uuidv4(),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        secure: 'auto'
      }
    })
    */

    app.route({
      method: 'GET',
      url: '/',
      schema: {
        querystring: { client: { type: 'string' } }
      },
      handler: async (req, reply) => {
        return await this.#serveIndex(req, reply)
      }
    })

    app.route({
      method: 'POST',
      url: '/_SERVER',
      handler: (req, reply) => {
        return this.#serverHandler(req, reply)
      }
    })

    app.route({
      method: 'GET',
      url: '/_SSE/:clientUID',
      handler: (req, reply) => {
        log.warn('<<<', req.params.clientUID)
        const headers = {
          'Cache-Control': 'no-cache',
          'Content-Type': 'text/event-stream'
        }
        var client = Clients.findClient(req.params.clientUID)
        if (client) {
          var stream = client.establishSSEStream(req.id)
          reply.headers(headers).send(stream)
        } else {
          reply.send('error: Invalid Client \n\n')
        }
      }
    })

    this.#app = app

    const port = config?.port || '8080'
    app.listen(port, (err, address) => {
      if (err) {
        log.error(err)
      } else {
        log.info(_('WEBSERVER_SERVING_ADDRESS', { address: address }))
      }
    })
  }

  #serverHandler (req, reply) {
    return new Promise((resolve, reject) => {
      const { api, payload } = req.body
      if (api === 'CLIENT_CONNECTED') {
        this.#clientConnected(payload.clientName, payload.clientUID)
        reply.send({ reply: 'ok' })
      }
      resolve()
    })
  }

  #clientConnected (clientName, clientUID) {
    Clients.clientConnected(clientName, clientUID)
  }

  async #serveIndex (req, reply) {
    const stream = req.raw.stream
    var client = req.query.client || 'default'
    reply.type('text/html').send(this.#renderIndex(client))

    // BELOW: For Server Push
    const sendFile = (stream, obj) => {
      return new Promise((resolve, reject) => {
        const headers = {}
        if (obj.contentLength) headers['content-length'] = obj.contentLength
        if (obj.lastModified) headers['last-modified'] = obj.lastModified
        if (obj.contentType) headers['content-type'] = obj.contentType
        if (obj.etag) headers.ETag = obj.etag
        headers[':status'] = 200
        stream.respond(headers)
        stream.end(fs.readFileSync(obj.filePath))
        stream.on('close', () => {
          log.info(_('WEBSERVER_SERVER_PUSH', { file: obj.filePath }))
          resolve()
        })
      })
    }
    const pushFile = (stream, obj) => {
      return new Promise((resolve, reject) => {
        stream.pushStream({ ':path': obj.url }, (err, pushStream) => {
          if (err) {
            throw err
          }
          sendFile(pushStream, obj).then(() => {
            resolve()
          })
        })
      })
    }
    if (this.#http2 && this.#config.useExperimentalServerPush) {
      var assets = [...this.#mainAssets, ...this.#packageAssets, ...this.#clientAssets[client]]
      for (var a of assets) {
        await pushFile(stream, a)
      }
    }
  }

  async #prepareAssets () {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const cands = ['translations', 'shared', 'resources', 'client']
          var assets = []
          for (var cand of cands) {
            var cPath = path.join(__basepath, cand)
            var asset = await scanAssets(cPath, (url) => {
              if (cand === 'client') return path.join('/_/', url)
              return path.join('/_/', cand, url)
            })
            assets = [...assets, ...asset]
          }
          resolve(assets)
        } catch (e) {
          reject(e)
        }
      })()
    })
  }

  #preparePackageAssets () {
    return new Promise((resolve, reject) => {
      (async () => {
        resolve(await Packages.getActiveAssets())
      })()
    })
  }

  #prepareClientAssets () {
    return new Promise((resolve, reject) => {
      (async () => {
        resolve(await Clients.getAssets())
      })()
    })
  }
}

const Webserver = new _Webserver()

export default Webserver
