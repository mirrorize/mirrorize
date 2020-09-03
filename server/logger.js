import chalk from 'chalk'
import log from 'loglevel'
import prefix from 'loglevel-plugin-prefix'

const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.white,
  INFO: chalk.green,
  WARN: chalk.yellow,
  ERROR: chalk.red
}

prefix.reg(log)

if (process.env.MZ_LOGLEVEL) {
  log.setDefaultLevel(process.env.MZ_LOGLEVEL)
  console.info(`Log level is set to ${process.env.MZ_LOGLEVEL}`)
}

prefix.apply(log, {
  format (level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](`${name}`)}\t`
  }
})

function Logger (name = null) {
  if (!name || !name.trim()) return log
  name = name.toUpperCase()
  if (name.length > 12) name = name.slice(0, 11) + '~'
  return log.getLogger(name)
}


export default Logger
