import webpack from 'webpack'
import clean from './clean'
import createWebpackConfig from './createWebpackConfig'

export default async params => {
  await clean(params)

  const { client: clientConfig, server: serverConfig } = createWebpackConfig(params)
  webpack([clientConfig, serverConfig]).run((error, stats) => {
    if (error) {
      console.error(error)
      return
    }

    console.info(stats.toString(serverConfig.stats))
  })
}
