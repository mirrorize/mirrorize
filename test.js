import fastify from 'fastify'
import pkg from 'fastify-auto-push'
import fs from 'fs'
import path from 'path'

const { staticServe } = pkg
const __dirname = path.resolve()

const STATIC_DIR = path.join(__dirname, 'resources')
const CERTS_DIR = path.join(__dirname, 'http2cert')
const PORT = 3000

async function start () {
  const server = fastify({
    http2: true,
    https: {
      key: fs.readFileSync(path.join(CERTS_DIR, 'localhost+2-key.pem')),
      cert: fs.readFileSync(path.join(CERTS_DIR, 'localhost+2.pem'))
    }
  })

  server.register(staticServe, {
    root: STATIC_DIR
  })

  await server.listen(PORT)

  console.log(`Listening on port ${PORT}`)
}

start().catch(console.error)