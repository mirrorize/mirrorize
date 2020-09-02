import fs from 'fs'
import path from 'path'
import fastify from 'fastify'
import fastifyStatic from 'fastify-static'
import fastifyCookie from 'fastify-cookie'
import fastifySession from 'fastify-session'
import { v4 as uuidv4 } from 'uuid'

const __basename = path.resolve()

class _Webserver {
  #config = {}
  #server = null

  init (config = {}) {
    return new Promise((resolve, reject) => {
      this.#config = config
      var r = this.#initServer(config.webserver)
      if (r instanceof Error) {
        reject(r)
        return
      }
      resolve()
    })
  }

  #initServer (config) {
    var opts = {
      http2: config.useHTTP2
    }
    if (config.useHTTP2 === true) {
      const key = config?.key || 'http2cert/localhost+2-key.pem'
      const cert = config?.certificate || 'http2cert/localhost+2.pem'
      var kp = path.join(__basename, key)
      var cp = path.join(__basename, cert)
      if (!fs.existsSync(kp) || !fs.existsSync(cp)) {
        const e = new Error('Invalid SSL certificate or key. Check your http2cert directory.')
        return e
      }
      opts.https = {
        key: fs.readFileSync(kp),
        cert: fs.readFileSync(cp)
      }
    }
    var opts = Object.assign({}, opts, config.fastifyOptions)
    var server = fastify(opts)
    server.register(fastifyCookie)
    server.register(fastifySession, {
      secret: uuidv4(),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        secure: 'auto'
      }
    })

    server.register(fastifyStatic, {
      root: path.join(__basename, 'node_modules'),
      prefix: '/node_modules/',
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'resources'),
      prefix: '/resources/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'clients'),
      prefix: '/clients/',
      decorateReply: false
    })
    server.register(fastifyStatic, {
      root: path.join(__basename, 'client'),
      prefix: '/_',
      decorateReply: false
    })
    server.get('/', (req, res) => {
      res.code(200).send({ hello: 'world' })
    })
    this.#server = server

    const port = config?.port || '8080'
    server.listen(port)
  }

  prepareRoutes() {
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}

const Webserver = new _Webserver()

export default Webserver
