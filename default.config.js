export default {
  webserver: {
    port: 8080,
    logger: false,
    certificate: process.env.MIRRORIZE_CERT,
    key: process.env.MIRRORIZE_KEY
  }
}
