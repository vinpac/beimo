import webpack from 'webpack'
import webpackConfig from './webpack.config'
import parseDefaults from './parseDefaults'
import clean from './clean'
import copy from './copy'

export default async params => {
  await parseDefaults(params)
  await clean(params)
  await copy(params)

  const { server: serverConfig, client: clientConfig } = webpackConfig(params)

  webpack([clientConfig, serverConfig]).run((error, stats) => {
    if (error) {
      throw error
    }

    console.info(stats.toString(serverConfig.stats))
  })
}
