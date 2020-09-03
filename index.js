import './server/env.js'
import path from 'path'
import fs from 'fs'
import { Logger, Configure, Packages, Webserver, Workers } from '#lib'
import _ from './server/systemtranslate.js'

const __dirname = path.resolve()

const log = Logger('INDEX')



process.on("uncaughtException", (err) => {
  log.error(err)
  log.error(_('INDEX_ERR_UNCAUGHT_EXCEPTION'))
})
process.on("unhandledRejection", (reason, p) => {
  log.error(_('INDEX_ERR_UR_AT_PROMISE', { reason: reason }), p)
  log.error(_('INDEX_ERR_UNHANDLED_REJECTION'))
})


const scenario = async () => {
  const scenarioError = (error) => {
    log.warn(error.message)
    log.error(error)
    process.exit(-1)
  }

  var config = await Configure(__dirname).catch(scenarioError)
  await Packages.init(config, path.join(__dirname, 'packages')).catch(scenarioError)
  await Workers.init(config, Packages.getActivePackages()).catch(scenarioError)
  await Webserver.init(config.server || {}).catch(scenarioError)
  await Webserver.prepareRoutes().catch(scenarioError)



  // await Admin.init((config.adminserver ?? config.webserver) || {}, Packages.getPackages()).catch(scenarioError)
  // await Webserver.registAssetRoutes(Packages.getPackages()).catch(scenarioError)
}

scenario()
