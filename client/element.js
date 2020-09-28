/* global HTMLElement M */

function mergeDeep (base, over) {
  const isPlainObject = obj => obj && obj.constructor === Object && Object.getPrototypeOf(obj) === Object.prototype
  var cBase = Object.assign({}, base)
  for (var [key, value] of Object.entries(over)) {
    if (!cBase[key]) {
      cBase[key] = value
    } else {
      if (isPlainObject(value)) {
        cBase[key] = mergeDeep(cBase[key], value)
      } else {
        cBase[key] = value
      }
    }
  }
  return cBase
}

class CustomElement extends HTMLElement {
  static seqId = 1

  static getClassName () {
    if (this.name) return this.name.toLowerCase()
    return this.tagName.toLowerCase()
  }

  // traits of the CustomElement
  get isShadow () {
    return false
  }

  get importedShadowCSS () {
    return []
  }

  get hidable () {
    return true
  }

  get suspendable () {
    return true
  }

  get shadowMode () {
    return 'open' // If .isShadow() is false, this will not be used.
  }

  get resizeObservable () {
    return false
  }

  get reconfigurable () {
    return true
  }

  get rebindable () {
    return true
  }

  get templateOverridable () {
    return true
  }

  static attritbutesToObserve () {
    var observe = ['bindto']
    if (this.reconfigurable) {
      observe.push('config')
    }
    if (this.templateOverridable) {
      observe.push('template')
    }
    return observe
  }

  // Custom Element primary callbacks of lifecycle
  // constructor ()
  // connectedCallback ()
  // disconnectedCallback ()
  // adoptedCallback () // anyway, it will not be used.
  // attributeChangedCallback ()
  // static observedAttributes ()

  constructor () {
    super()
    console.log('Construct???', this)
    this.displayLock = new Set()
    this.bindTo = null
    this.config = {}
    var seq = 'M_' + CustomElement.seqId++
    Object.defineProperty(this, 'uid', {
      value: seq
    })
    Object.defineProperty(this, 'mTagName', {
      value: this.tagName.toLowerCase()
    })

    if (this.isShadow) {
      this.attachShadow({ mode: this.shadowMode })
    }
  }

  connectedCallback () {
    console.info('connected')
    this.setAttribute('uid', this.uid)
    this.setAttribute('tagname', this.mTagName)
    this.setAttribute('mirrorized', '')
    if (this.hasAttribute('hiddenonstart')) {
      this.hide(null, { timing: { duration: 0 } })
      this.mhidden = true
    }
    if (this.resizeObservable) {
      // MZ.addResizeObserver(this)
    }
    this.update()
    this.onConnected()
    this.#_ready()
  }

  disconnectedCallback () {
    if (this.resizeObservable) {
      // MZ.removeResizeObserver(this)
    }
    this.onDisconnected()
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'bindto') this.bindTo = newValue
    if (name === 'config') {
      var newConfig = M.getCustomConfig(newValue)
      this.config = mergeDeep(this.config, newConfig)
    }
    if (name === 'template') {
      this.update()
    }
    this.onAttributeChanged(name, oldValue, newValue)
  }

  addoptedCallback () {
    // do nothing at this moment.
  }

  static get observedAttributes () {
    var parent = CustomElement.attritbutesToObserve()
    var child = this.attritbutesToObserve()
    return [...new Set([...parent, ...child])]
  }

  // inner utilty
  #_ready () {
    if (this.isConnected && !this.isReady) {
      Object.defineProperty(this, 'isReady', {
        value: true
      })
      this.onReady()
    }
  }

  #_exportChildrenParts () {
    if (this.shadowRoot) {
      var all = this.contentDom.querySelectorAll('[part]')
      var exportparts = [...all].map((d) => { return d.getAttribute('part') }).join(', ')
      if (exportparts) this.setAttribute('exportparts', exportparts)
    }
  }

  #_applyTemplate () {
    var contentDom = (this.shadowRoot) ? this.shadowRoot : this
    var templateId = this.getAttribute('template') || this.mTagName
    var found = M.getTemplateById(templateId)
    if (found) {
      contentDom.innerHTML = ''
      contentDom.appendChild(found)
    }
  }

  // public command methods
  update () {
    return new Promise((resolve, reject) => {
      var contentDom = (this.shadowRoot) ? this.shadowRoot : this
      if (!this.shadowRoot && this.innerHTML.trim() !== '') {
        // do nothing; already prepared.
      } else {
        this.#_applyTemplate()
      }
      resolve(this.onUpdateRequested(contentDom))
    })
  }

  show (lock = null, option = {}) {
    return new Promise((resolve, reject) => {
      var {
        animation = {
          opacity: [0, 1]
        },
        timing = {
          duration: 1000,
          easing: 'ease-in-out'
        }
      } = option
      this.displayLock.delete(lock)
      if (this.displayLock.size === 0) {
        if (this.hasAttribute('hidden')) {
          this.removeAttribute('hidden')
          var ani = this.animate(animation, timing)
          ani.onfinish = () => {
            this.onShown()
            this.resume()
            resolve()
          }
        } else {
          resolve()
        }
      } else {
        resolve()
      }
    })
  }

  hide (lock = null, option = {}) {
    return new Promise((resolve, reject) => {
      var {
        animation = {
          opacity: [1, 0]
        },
        timing = {
          duration: 1000,
          easing: 'ease-in-out'
        }
      } = option
      if (lock) this.displayLock.add(lock)
      if (!this.getAttribute('hidden')) {
        var ani = this.animate(animation, timing)
        ani.onfinish = () => {
          this.setAttribute('hidden', '')
          this.onHidden()
          this.suspend()
          resolve()
        }
      } else {
        resolve()
      }
    })
  }

  resume () {
    if (this.suspendable) {
      this.onResumeRequested()
    }
    return this.suspendable
  }

  suspend () {
    if (this.suspendable) {
      this.onSuspendRequested()
    }
    return this.suspendable
  }

  // to be implemented in real child element class
  onDefined () {}
  onReady () {}
  onAttributeChanged (name, oldValue, newValue) {}
  onConnected () {}
  onDisconnected () {}
  onShown () {}
  onHidden () {}
  onSuspendRequested () {}
  onResumeRequested () {}
  onUpdateRequested () {}
}

if (window) window.CustomElement = CustomElement

export default CustomElement
