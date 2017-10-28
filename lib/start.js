import webpack from 'webpack'
import path from 'path'
import chalk from 'chalk'
import express from 'express'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
import createWebpackConfig from './createWebpackConfig'
import parseDefaults from './parseDefaults'
import clean from './clean'
import utils from '../utils'

function createCompilationPromise(name, compiler, config) {
  return new Promise((resolve, reject) => {
    console.log(
      `${chalk.bgMagenta(` ${name.toUpperCase()} `)}${chalk.bgMagentaBright(' Compiling... ')}\n`,
    )

    compiler.plugin('done', stats => {
      const compilationTime = `${chalk.bold(stats.endTime - stats.startTime)}ms`
      if (stats.hasErrors()) {
        utils.logEvent(stats.compilation.name, false, `Failed in ${compilationTime}`)
      } else {
        utils.logEvent(stats.compilation.name, true, `Compiled successfully in ${compilationTime}`)
      }

      console.info(stats.toString({ ...config.stats, timings: false }))
      stats.compilation.warnings.forEach(warning => {
        console.warn(warning)
      })

      if (stats.hasErrors()) {
        reject(new Error('Compilation failed!'))
        return
      }

      resolve(stats)
    })
  })
}

export default async params => {
  // await parseDefaults(params)
  await clean(params)

  const { client: clientConfig, server: serverConfig } = createWebpackConfig(params)

  const server = express()
  server.use(errorOverlayMiddleware())
  server.use(express.static(params.staticPath))

  // Configure client-side hot module replacement
  clientConfig.entry.client = [path.resolve(__dirname, '../lib', 'webpackHotDevClient')]
    .concat(clientConfig.entry.client)
    .sort((a, b) => b.includes('polyfill') - a.includes('polyfill'))
  clientConfig.output.filename = clientConfig.output.filename.replace('chunkhash', 'hash')
  clientConfig.output.chunkFilename = clientConfig.output.chunkFilename.replace('chunkhash', 'hash')
  clientConfig.module.rules = clientConfig.module.rules.filter(x => x.loader !== 'null-loader')
  clientConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin(),
  )

  // Configure server-side hot module replacement
  serverConfig.output.hotUpdateMainFilename = 'updates/[hash].hot-update.json'
  serverConfig.output.hotUpdateChunkFilename = 'updates/[id].[hash].hot-update.js'
  serverConfig.module.rules = serverConfig.module.rules.filter(x => x.loader !== 'null-loader')
  serverConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin(),
  )

  // utils.clearConsole()

  const multiCompiler = webpack([clientConfig, serverConfig])
  const clientCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'client')
  const serverCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'server')
  const clientPromise = createCompilationPromise('client', clientCompiler, clientConfig)
  const serverPromise = createCompilationPromise('server', serverCompiler, serverConfig)

  // https://github.com/webpack/webpack-dev-middleware
  server.use(
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      quiet: true,
      watchOptions: params.watchOptions,
    }),
  )

  // https://github.com/glenjamin/webpack-hot-middleware
  server.use(webpackHotMiddleware(clientCompiler, { log: false }))

  let app
  let appPromise
  let appPromiseResolve
  let appPromiseIsResolved = true

  serverCompiler.plugin('compile', () => {
    if (!appPromiseIsResolved) return
    appPromiseIsResolved = false

    appPromise = new Promise(resolve => {
      appPromiseResolve = newApp => {
        app = newApp
        appPromiseIsResolved = true
        resolve()
      }
    })
  })

  server.use((req, res, next) => {
    appPromise.then(() => app.handle(req, res, next)).catch(error => console.error(error))
  })

  function checkForUpdate(fromUpdate) {
    const hmrPrefix = '[\x1b[35mHMR\x1b[0m] '
    if (!app.hot) {
      throw new Error(`${hmrPrefix}Hot Module Replacement is disabled.`)
    }
    if (app.hot.status() !== 'idle') {
      return Promise.resolve()
    }
    return app.hot
      .check(true)
      .then(updatedModules => {
        if (!updatedModules) {
          if (fromUpdate) {
            console.info(`${hmrPrefix}Update applied.`)
          }
          return
        }
        if (updatedModules.length === 0) {
          console.info(`${hmrPrefix}Nothing hot updated.`)
        } else {
          console.info(`${hmrPrefix}Updated modules:`)
          updatedModules.forEach(moduleId => console.info(`${hmrPrefix} - ${moduleId}`))
          checkForUpdate(true)
        }
      })
      .catch(error => {
        if (['abort', 'fail'].includes(app.hot.status())) {
          console.warn(`${hmrPrefix}Cannot apply update.`)
          delete require.cache[require.resolve('../build/server')]
          // eslint-disable-next-line global-require, import/no-unresolved
          app = require('../build/server').default
          console.warn(`${hmrPrefix}App has been reloaded.`)
        } else {
          console.warn(`${hmrPrefix}Update failed: ${error.stack || error.message}`)
        }
      })
  }

  serverCompiler.run(() => {})

  await clientPromise
  await serverPromise

  // eslint-disable-next-line
  app = __non_webpack_require__(path.join(params.distPath, 'server.js')).default
  appPromiseResolve(app)

  server.listen(params.port)
}
