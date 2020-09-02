import dotenv from 'dotenv'
import { createRequire } from 'module'
import path from 'path'
import { Configure, Packages, Webserver, Workers } from '@lib'
// import Admin from './server/admin.js'

dotenv.config()

const require = createRequire(import.meta.url)


const __dirname = path.resolve()

const scenario = async () => {
  const scenarioError = (error) => {
    console.warn(error.message)
    console.error(error)
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
