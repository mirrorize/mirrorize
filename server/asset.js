// import _ from './systemtranslate.js'
// import { Logger } from '#lib'
import fs from 'fs'
import path from 'path'
import globby from 'globby'
import mime from 'mime'
import etag from 'etag'

// const log = Logger('ASSET')

function scanAssets (basedir, url = (fPath) => { return fPath }) {
  return new Promise((resolve, reject) => {
    (async () => {
      var files = await globby('**/*', {
        objectMode: true,
        onlyFiles: true,
        cwd: basedir
      })
      var assets = []
      for (const file of files) {
        var tp = file.path.split('/')
        var type = tp[0]
        if (tp.length <= 1) type = ''
        if (!['js', 'modulejs', 'css', 'templates', 'elements'].includes(type)) type = ''
        var { name, path: fPath } = file
        var rPath = path.join(basedir, fPath)
        var stat = fs.lstatSync(rPath)
        assets.push({
          type: type,
          url: url(fPath),
          internal: true,
          contentLength: stat.size,
          lastModified: stat.mtime.toUTCString(),
          contentType: mime.getType(name),
          filePath: rPath,
          etag: etag(stat)
        })
      }
      resolve(assets)
    })()
  })
}

export default scanAssets
