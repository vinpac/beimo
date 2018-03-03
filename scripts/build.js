import webpack from 'webpack'
import chalk from 'chalk'
import { resolve } from 'path'
import copy from './copy'
import createWebpackConfig from '../build/create-webpack-config'
import createPageEntries from '../build/create-entries'
import { loadAsync, extractPagesFromRoutes } from '../build/parse-routes-map'
import clean from './clean'

export default async params => {
  await clean(params)
  await copy(params)

  const routes = await loadAsync(resolve(params.sourceDir, 'pages', 'index.yml'))
  const pages = extractPagesFromRoutes(routes)

  // Add entries to params
  Object.assign(params, createPageEntries(params, pages))

  console.info(`${chalk.bold.cyan('WAIT')} ${chalk.cyan('Compiling for production...')}`)
  const { clientConfig, serverConfig } = createWebpackConfig(params, { routes, pages })

  const startDate = new Date()
  webpack([clientConfig, serverConfig]).run((error, stats) => {
    const compilationTime = new Date() - startDate
    if (error) {
      console.info(`${chalk.bold.red('WAIT')} ${chalk.cyan(`Failed after ${compilationTime}ms`)}`)
      throw error
    }

    console.info(`${chalk.bold.green('DONE')} ${
      chalk.cyan(`Compiled successfully in ${compilationTime}ms`)}`)
    console.info(stats.toString(serverConfig.stats))
  })
}
