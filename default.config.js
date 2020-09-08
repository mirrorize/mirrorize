// Don't modify this file directly.
// Copy this file and rename it as `custom.config.js`, then use it.

export default {
  server: {
    webserver: {
      port: 8080,
      useHTTP2: true,
      certificate: process.env.MZ_HTTP2_CERT,
      key: process.env.MZ_HTTP2_KEY,
      fastifyOptions: {
        logger: true
      }
    },
    admin: {
      port: 8081,
      useHTTP2: false,
      logger: false,
      certificate: null,
      key: null,
      username: process.env.MZ_ADMIN_USERNAME,
      password: process.env.MZ_ADMIN_PASSWORD
    }
  },
  
}
