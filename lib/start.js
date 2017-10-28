import webpack from 'webpack'
import webpackConfig from './webpack.config'
import parseDefaults from './parseDefaults'
import copy from './copy'

export default async params => {
  await parseDefaults(params)
  await copy(params)

  const { server: serverConfig, client: clientConfig } = webpackConfig(params)

  webpack([clientConfig, serverConfig]).run((error, stats) => {
    if (error) {
      throw error
    }

    console.info(stats.toString(serverConfig.stats))
  })
}
