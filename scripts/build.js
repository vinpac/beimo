import webpack from 'webpack'
import clean from './clean'
import createWebpackConfig from './createWebpackConfig'
import utils from '../utils'

export default async params => {
  await clean(params)
  utils.logEvent('Build', params.isRelease ? ' RELEASE ' : ' DEVELOPMENT ')

  const { client: clientConfig, server: serverConfig } = createWebpackConfig(params)
  webpack([clientConfig, serverConfig]).run((error, stats) => {
    if (error) {
      utils.logEvent('Build', false)
      console.error(error)
      return
    }

    utils.logEvent('Build', true)
    console.info(stats.toString(serverConfig.stats))
  })
}
