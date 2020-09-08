// import '/_/node_modules/loglevel/dist/loglevel.js'
// log.warn('test')

import Translate from '/_/shared/translate.js'

class _M {
  constructor () {
    const getParams = (url) => {
      var params = {}
      var parser = document.createElement('a')
      parser.href = url
      var query = parser.search.substring(1)
      var vars = query.split('&')
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=')
        params[pair[0]] = decodeURIComponent(pair[1])
      }
      return params
    }

    const readonly = (prop, val) => {
      Object.defineProperty(this, prop, {
        value: val
      })
    }

    readonly('protocol', window.location.protocol)
    readonly('address', window.location.hostname)
    readonly('port', window.location.port)
    readonly('serverURL', `${this.protocol}://${this.address}:${this.port}`)
    var params = getParams(window.location.href)
    readonly('clientName', (params.client) ? params.client : 'default')
    readonly('clientUID', this.clientName + '_' + Date.now())
    this.templates = new DocumentFragment()
    this.onReadyJobs = []
    
  }
}

const m = new _M()
window.M = {}

export default m