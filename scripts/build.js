import webpack from 'webpack'
import chalk from 'chalk'
import clean from './clean'
import createWebpackConfig from './createWebpackConfig'
import utils from '../utils'

export default async params => {
  await clean(params)
  utils.logEvent('Build', params.isRelease ? ' RELEASE ' : ' DEVELOPMENT ', 'yellow')

  const { client: clientConfig, server: serverConfig } = createWebpackConfig(params)

  const startDate = new Date()
  webpack([clientConfig, serverConfig]).run((error, stats) => {
    const compilationTime = `${chalk.bold(new Date() - startDate)}ms`
    if (error) {
      utils.logEvent('Build', `Failed in ${compilationTime}`, 'red')

      throw error
    }

    utils.logEvent('Build', `Compiled successfully in ${compilationTime}`)
    console.info(stats.toString(serverConfig.stats))
  })
}
