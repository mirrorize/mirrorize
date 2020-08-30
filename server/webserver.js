import fs from 'fs'
import path from 'path'
import fastify from 'fastify'

const __basename = path.resolve()

class _Webserver {
  constructor () {
    this.config = {}
  }

  init (config = {}) {
    return new Promise((resolve, reject) => {
      this.config = config
      var r = this.initServer(config)
      if (r instanceof Error) {
        reject(r)
        return
      }
      resolve()
    })
  }

  initServer (config) {
    const key = config?.key || 'http2cert/localhost+2-key.pem'
    const cert = config?.certificate || 'http2cert/localhost+2.pem'
    var kp = path.join(__basename, key)
    var cp = path.join(__basename, cert)
    if (!fs.existsSync(kp) || !fs.existsSync(cp)) {
      const e = new Error('Invalid SSL certificate or key. Check your http2cert directory.')
      return e
    }
    var defOpts = {
      http2: true,
      https: {
        key: fs.readFileSync(kp),
        cert: fs.readFileSync(cp)
      }
    }
    var opts = Object.assign({}, config, defOpts)
    var server = fastify(opts)
    server.get('/', (req, res) => {
      res.code(200).send({ hello: 'world' })
    })
    server.listen(8080)
  }
}

const Webserver = new _Webserver()

export default Webserver
