import webpack from 'webpack'
import webpackConfig from './webpack.config'
import parseDefaults from './parseDefaults'

export default async opts => {
  await parseDefaults(opts)
  const { server: serverConfig, client: clientConfig } = webpackConfig(opts)

  webpack([clientConfig, serverConfig]).run((error, stats) => {
    if (error) {
      throw error
    }

    console.info(stats.toString(serverConfig.stats))
  })
}
