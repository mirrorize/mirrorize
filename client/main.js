/* global DocumentFragment, fetch, Request, initValues, EventSource */

// import Translate from '_/shared/translate.js'

// import test from './_/assets/core/modulejs/testmodule.js'
// import * as pkg from './_/node_modules/socket.io-client/dist/socket.io.js'

// console.log(pkg)

import './element.js'

function loadModuleScript (url) {
  return new Promise((resolve, reject) => {
    import(url).then((module) => {
      resolve(module)
    }).catch(reject)
  })
}

function readFileURL (reqObj, opts = {}, type = null) {
  const defaultOpts = {
    headers: {
      pragma: 'no-cache',
      'cache-control': 'no-cache'
    }
  }
  return new Promise((resolve, reject) => {
    var request = (typeof reqObj === 'string') ? new Request(reqObj) : reqObj
    opts = Object.assign({}, defaultOpts, opts)
    fetch(request, opts).then((response) => {
      if (!response.ok) {
        reject(response.status)
        return false
      }
      if (typeof response[type] === 'function') {
        return response[type]()
      }
    }).then(resolve)
  })
}

class _M {
  #templates = new DocumentFragment()
  #sse = null
  constructor () {
    (async () => {
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

      const readonly = async (prop, val) => {
        Object.defineProperty(this, prop, {
          value: val
        })
      }

      var params = getParams(window.location.href)
      await readonly('clientName', (params?.client) ? params?.client : 'default')
      var { default: defConfig } = await loadModuleScript(`/_/clients/${this.clientName}/config.js`).catch((e) => {
        console.error('Something wrong')
        console.error(e)
      })

      var uid = params?.uid || defConfig?.uid || Date.now()
      this.config = defConfig

      await readonly('clientUID', this.clientName + '_' + uid)
      await readonly('protocol', window.location.protocol)
      await readonly('address', window.location.hostname)
      await readonly('port', window.location.port)
      await readonly('serverURL', `${this.protocol}://${this.address}:${this.port}`)

      await this.#loadTemplates(initValues.templateAssets)
      await this.#loadModules(initValues.moduleAssets)
      await this.#loadElements(initValues.elementAssets)

      await this.#establish()
      await this.#renderBody()
    })()
  }

  #renderBody () {
    return new Promise((resolve, reject) => {
      var bodyTemplate = this.getTemplateById('body')
      if (bodyTemplate) {
        document.body.append(bodyTemplate)
      }
      resolve()
    })
  }

  #establish () {
    return new Promise((resolve, reject) => {
      this.#serverCall(
        'CLIENT_CONNECTED',
        {
          clientName: this.clientName,
          clientUID: this.clientUID
        },
        (response) => {
          if (response.reply === 'ok') {
            this.#listenSSE()
          }
        }
      ).then(resolve)
    })
  }

  #heartbeatListener (event) {
    // const parsed = JSON.parse(event.data)
    // console.log(parsed)
  }

  #listenSSE () {
    this.#sse = new EventSource('/_SSE/' + this.clientUID)
    this.#sse.addEventListener('heartbeat', this.#heartbeatListener)

    this.#sse.onerror = (error) => {
      console.error('SSE error', error)
      this.#sse.close()
      this.#sse = null
    }
  }

  async #loadModules (urls) {
    for (var url of urls) {
      var module = await loadModuleScript(url).catch((e) => {
        console.error(e)
      })
      window.M = Object.assign({}, window.M, module.default)
    }
    // console.log(window.M)
  }

  #loadElements (urls) {
    const load = (url) => {
      return new Promise((resolve, reject) => {
        import(url).then((module) => {
          var klass = module.default
          var tagName = url.substring(url.lastIndexOf('/') + 1).split('.').slice(0, -1).join('.')
          window.customElements.define(tagName, klass)
          console.info('CustomElement loaded:', tagName)
          resolve()
        }).catch((e) => {
          console.warn('CustomElement loading failed:', url)
          console.error(e)
          resolve()
        })
      })
    }
    return new Promise((resolve, reject) => {
      try {
        if (!urls || !Array.isArray(urls) || urls.length < 1) resolve()
        var promises = []
        for (const url of urls) {
          promises.push(load(url))
        }
        Promise.allSettled(promises).then(() => {
          console.info('All customElements are loaded.')
          resolve()
        })
      } catch (e) {
        console.warn(e)
        reject(e)
      }
    })
  }

  async #loadTemplates (urls) {
    var template = new DocumentFragment()
    for (var url of urls) {
      var tmpl = await readFileURL(url, null, 'text').catch((e) => {
        console.error(e)
      })
      var doms = document.createRange().createContextualFragment(tmpl)
      for (const dom of [...doms.children]) {
        var exist = template.getElementById(dom.id)
        if (exist) exist.remove()
        template.appendChild(dom)
      }
    }
    this.#templates = template
  }

  #serverCall (api, payload, response = () => {}) {
    return new Promise((resolve, reject) => {
      fetch('/_SERVER', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          api: api,
          payload: payload,
          test: 'test'
        })
      }).then(response => response.json())
        .then((data) => {
          response(data)
          resolve(data)
        })
        .catch((error) => {
          response(error)
          reject(error)
        })
    })
  }

  getTemplateById (id) {
    var dom = this.#templates.getElementById(id)

    if (dom) {
      return dom.content.cloneNode(true)
    }
    return null
  }

  getCustomConfig (key) {
    return this.config[key]
  }
}

const m = new _M()

window.M = {
  // registerWindowOnLoadJob: m.registerWindowOnLoadJob.bind(m),
  getTemplateById: m.getTemplateById.bind(m),
  getCustomConfig: m.getCustomConfig.bind(m),
  loadModuleScript: loadModuleScript,
  readFileURL: readFileURL
}

export default m
