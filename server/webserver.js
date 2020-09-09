import _ from './systemtranslate.js'
import { Clients, Packages, Logger, Workers, scanAssets, __basepath } from '#lib'
import fs from 'fs'
import path from 'path'
// import http2 from 'http2'
import fastify from 'fastify'
import fastifyStatic from 'fastify-static'
import fastifyCookie from 'fastify-cookie'
import fastifySession from 'fastify-session'
// import pkg from 'fastify-auto-push'
import { v4 as uuidv4 } from 'uuid'
// import globby from 'globby'

// import { request } from 'http'

// const fastifyStatic = pkg.staticServe

const log = Logger('WEBSERVER')

const __basename = path.resolve()

class _Webserver {
  #config = {}
  #server = null
  #assetHTML = ''
  #http2 = true
  #mainAssets = []
  #clientAssets = {}
  #packageAssets = []

  init (config = {}) {
    return new Promise((resolve, reject) => {
      (async () => {
        this.#config = config
        this.#mainAssets = await this.#prepareAssets()
        this.#packageAssets = await this.#preparePackageAssets()
        this.#clientAssets = await this.#prepareClientAssets()
        var r = this.#initServer(config.webserver)
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
        }
      }
      return text
    }
    var assets = [...this.#mainAssets, ...this.#packageAssets, ...this.#clientAssets[client]]
    var result = dress(assets)
    var hPath = path.join(__basename, 'client', 'index.html')
    var html = fs.readFileSync(hPath, { encoding: 'UTF-8' })
    html = html.replace('{{ASSETS}}', result)
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
    var server = fastify(opts)

    const workers = Workers.getActiveWorkers()
    for (var w of workers) {
      var aPath = path.join(__basename, w.packagePath, 'assets')
      if (!fs.existsSync(aPath)) continue
      server.register(fastifyStatic, {
        root: path.join(aPath),
        prefix: '/_/assets/' + w.name,
        decorateReply: false
      })
    }
    server.register(fastifyStatic, {
      root: path.join(__basename, 'node_modules'),
      prefix: '/_/node_modules/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'translations'),
      prefix: '/_/translations/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'shared'),
      prefix: '/_/shared/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'resources'),
      prefix: '/_/resources/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'clients'),
      prefix: '/_/clients/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'client'),
      prefix: '/',
      decorateReply: false
    })

    server.register(fastifyCookie)
    server.register(fastifySession, {
      secret: uuidv4(),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        secure: 'auto'
      }
    })

    server.route({
      method: 'GET',
      url: '/',
      schema: {
        querystring: { client: { type: 'string' } }
      },
      handler: async (req, reply) => {
        return await this.#serveIndex(req, reply)
      }
    })

    this.#server = server

    const port = config?.port || '8080'
    server.listen(port, (err, address) => {
      if (err) {
        log.error(err)
      } else {
        log.info(_('WEBSERVER_SERVING_ADDRESS', { address: address }))
      }
    })
  }

  async #serveIndex (req, reply) {
    var client = req.query.client || 'default'
    req.session.client = client
    reply.type('text/html').send(this.#renderIndex(client))
    const sendFile = (stream, obj) => {
      return new Promise((resolve, reject) => {
        const headers = {}
        if (obj.contentLength) headers['content-length'] = obj.contentLength
        if (obj.lastModified) headers['last-modified'] = obj.lastModified
        if (obj.contentType) headers['content-type'] = obj.contentType
        if (obj.etag) headers.ETag = obj.etag
        stream.respond({ ':status': 200, 'content-type': obj.contentType })
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
    const stream = req.raw.stream
    if (this.#http2) {
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
