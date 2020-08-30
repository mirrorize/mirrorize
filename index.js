import path from 'path'
import Configure from './server/configure.js'
import Components from './server/components.js'
import Workers from './server/workers.js'
import Webserver from './server/webserver.js'
import Admin from './server/admin.js'

const __dirname = path.resolve()

const scenario = async () => {
  const scenarioError = (error) => {
    console.warn(error.message)
    console.error(error)
    process.exit(-1)
  }

  var config = await Configure(__dirname).catch(scenarioError)
  await Components.init(config, path.join(__dirname, 'components')).catch(scenarioError)
  await Workers.init(config, Components.getComponents()).catch(scenarioError)
  await Webserver.init(config.webserver || {}).catch(scenarioError)
  await Admin.init((config.adminserver ?? config.webserver) || {}, Components.getComponents()).catch(scenarioError)
  // await Webserver.registAssetRoutes(Components.getComponents()).catch(scenarioError)
}

scenario()
