import fs from 'fs'
import path from 'path'
import Logger from './logger.js'
import Translate from '../shared/translate.js'

const log = Logger('SYST9N')

const SystemTranslate = Translate()

const dir = path.resolve('./', 'translations')

const readTranslation = () => {
  var ret = {}
  var files = fs.readdirSync(dir, { withFileTypes: true })
  for (var file of files) {
    if (file.isDirectory()) continue
    if (path.extname(file.name) !== '.json') continue
    var fPath = path.join(dir, file.name)
    try {
      var f = JSON.parse(fs.readFileSync(fPath, { encoding: 'utf-8' }))
      ret = Object.assign({}, ret, f)
    } catch (e) {
      log.warn('Invalid JSON parsing', fPath)
      continue
    }
  }
  return ret
}
var json = readTranslation()
SystemTranslate.loadTranslations(json)
const _ = SystemTranslate.translate.bind(SystemTranslate)

export default _
