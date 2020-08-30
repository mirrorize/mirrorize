import path from 'path'
import Configure from './server/configure.js'
import Components from './server/components.js'
import Workers from './server/workers.js'
import Webserver from './server/webserver.js'

const __dirname = path.resolve()

const scenarioError = (error) => {
  console.warn(error.message)
  console.error(error)
  process.exit(-1)
}

const scenario = async () => {
  var config = await Configure(__dirname).catch(scenarioError)
  await Components.init(config, path.join(__dirname, 'components')).catch(scenarioError)
  await Workers.init(config, Components.getComponents()).catch(scenarioError)
  var webserver = await Webserver.init(config.webserver ?? {}).catch(scenarioError)
  console.log(Webserver)
  // process.exit(0)
  // await Webserver.registAssetRoutes(assets).catch(scenarioError)
}

scenario()
