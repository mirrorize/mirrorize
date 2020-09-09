const isBrowser = (typeof window !== 'undefined')

var log = console

if (isBrowser) {
  log = console
} else {
  import('#lib').then(({ Logger }) => {
    log = Logger('TRANSLATE')
  })
}

class _Translate {
  #locales = []
  #translations = {}
  #formatters = {}
  static factory (locale = []) {
    return new _Translate(locale)
  }

  constructor (locales = []) {
    if (isBrowser) {
      locales.push(navigator.language)
    } else {
      const env = process.env
      const sysLang = env.MZ_LANG || env.MZ_LOCALE || env.LANG || env.LANGUAGE || env.LC_ALL || env.LC_MESSAGES
      locales.push(sysLang)
    }
    if (!locales.includes('en')) locales.push('en')
    locales = locales.map((lc) => {
      return new String(lc).replace(/_/g, '-') // For Non-BCP47 format.
    })

    if (isBrowser) {
      locales = locales.reduce((filtered, l) => {
        try {
          filtered.push(Intl.getCannonicalLocales(l))
        } catch (e) {
          log.log(e.message)
          log.warn(`${l} is a invalid locale identifier. (Standard:BCP-47)`)
        }
        return filtered      
      }, [])
    }
    
    this.#locales = locales
  }

  get locales () {
    return this.#locales
  }

  registerFormatter(format, func) {
    if (typeof func === 'function')
    this.#formatters[format] = func
  }

  loadTranslations (data = {}) {
    var json = data
    if (typeof data === 'function') {
      json = data()
    }
    var cand = []
    const availables = Object.keys(json)
    if (!Array.isArray(availables)) {
      log.warn('Invalid translation data')
      return false
    }
    for(var locale of this.#locales) {
      if (!locale) continue
      while (locale) {
        var termjs = locale
        locale = locale.slice(0, -1)
        if (availables.find((name) => {
          return name.toLowerCase() === termjs.toLowerCase()
        })) {
          if (!cand.includes(termjs)) cand.push(termjs)
        }
      }
    }

    if (cand.length < 1) {
      log.warn('There is no matched translations.')
    } else {
      this.#locales = []
      for (const c of cand) {
        this.#translations[c] = json[c]
        this.#locales.push(c)
      }
    }
  }


  translate (key, opts = {}) {
    var text = key
    var formatters = {}
    var pluralRules = {}
    var locale = null
    for(var l of this.#locales) {
      if (this.#translations[l]?.translations?.[key]) {
        text = this.#translations[l].translations[key]
        formatters = this.#translations[l].formatters || {}
        pluralRules = this.#translations[l].pluralRules || {}
        locale = l
        break
      }
    }
    if (Object.keys(opts).length < 1) return text
    for (const prop of Object.keys(opts)) {
      var pattern = `{{((?<t>${prop})((?:\\:)(?<f>\\w+))?((?:\\?)(?<r>\\w+))?)}}`
      var rx = new RegExp(pattern, "gm")
      var found = [...text.matchAll(rx)].map((i)=>{
        var val = opts[prop]
        var ph = i[0]
        var groups = i?.groups
        if (groups.f) {
          var formatter = formatters[groups.f] ?? {}
          var format = formatter.format
          if (formatter) {
            if (typeof this.#formatters[format] === 'function') {
              val = this.#formatters[format](locale, val, formatter)
            }
          }
        }
        if (groups.r) {
          var plural = new Intl.PluralRules(locale).select(val)
          var rules = pluralRules[groups.r] ?? {}
          val = rules?.[plural] ?? rules?.other ?? val
        }
        text = text.replace(ph, val)
        return i?.groups
      })
    }
    return text
  }

}

function Translate (locale = []) {
  const r = _Translate.factory(locale)
  r.registerFormatter('datetime', function (locales, dateObj, options = {}) {
    if (typeof dateObj !== 'object' || dateObj.constructor !== 'Date') return dateObj.toString()
    return new Intl.DateTimeFormat(locales, options).format(dateObj)
  })
  r.registerFormatter('relativeTime', function (locales, dateObj, options = {}) {
    if (typeof dateObj !== 'object' || dateObj.constructor !== 'Date') return dateObj.toString()
    return new Intl.RelativeTimeFormat(locales, options).fromat(dateObj)
  })
  r.registerFormatter('list', function (locales, listArray, options = {}) {
    if (!Array.isArray(listArray)) return listArray.toString()
    return new Intl.ListFormat(locales, options).format(listArray)
  })
  r.registerFormatter('number', function (locales, number, options = {}) {
    if (isNaN(number)) return number.toString()
    var ret = new Intl.NumberFormat(locales, options).format(number)
    return ret
  })
  r.registerFormatter('shorten', function (locales, text, options = {}) {
    if (typeof text !== 'string') text = text.toString() || ''
    var { maxLength = 40, pre = 20, post = 20, omitted="..." } = options
    if (pre + post > maxLength) maxLength = pre + post
    if (text.length < maxLength) return text
    return text.slice(0, pre) + omitted + text.slice((0 - post))
  })
  r.registerFormatter('cuttext', function (locales, text, options = {}) {
    if (typeof text !== 'string') text = text.toString() || ''
    if (!options.search) return text
    var { omitted="...", search } = options
    var len = search.length
    return omitted + text.slice(text.indexOf(search) + len)
  })
  return r
}

export default Translate