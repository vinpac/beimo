import webpack from 'webpack'
import path from 'path'
import chalk from 'chalk'
import express from 'express'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
import createWebpackConfig from '../lib/createWebpackConfig'
import clean from './clean'
import utils from '../../utils'


const hmrPrefix = `${chalk.bold.yellow('HMR ➜ ')}`
let clearConsole
let compiledTimes = 0
let lastCompiledName

function createCompilationPromise(name, compiler, config, params) {
  return new Promise((resolve, reject) => {
    utils.logEvent(name, 'Compiling...', false)

    compiler.plugin('done', stats => {
      if (compiledTimes > 1 && lastCompiledName !== name) {
        console.log('') // eslint-disable-line
      }

      lastCompiledName = name
      if (compiledTimes === 0) {
        clearConsole()
      }
      compiledTimes += 1

      const compilationTime = `${chalk.bold(stats.endTime - stats.startTime)}ms`
      if (stats.hasErrors()) {
        utils.logEvent(stats.compilation.name, `Failed in ${compilationTime}`, 'red')
      } else {
        utils.logEvent(stats.compilation.name, `Compiled successfully in ${compilationTime}`)
      }

      if (params.isVerbose || stats.hasErrors()) {
        console.info(stats.toString({ ...config.stats, timings: false }))
      }

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
  await clean(params)


  const cacheRegex = new RegExp(`^(${params.sourcePath}|${params.distPath})`)
  const clearCache = () => {
    // eslint-disable-next-line no-undef
    Object.keys(__non_webpack_require__.cache).forEach(modulePath => {
      if (cacheRegex.test(modulePath)) {
        // eslint-disable-next-line no-undef
        delete __non_webpack_require__.cache[modulePath]
      }
    })
  }

  clearConsole = () => {
    utils.clearConsole()
    console.info(`${chalk.bold.cyan(params.isRelease ? 'RELEASE' : 'DEVELOPMENT')}\n`)
  }

  const { client: clientConfig, server: serverConfig } = await createWebpackConfig(params)

  const server = express()
  server.use(errorOverlayMiddleware())
  server.use(express.static(params.staticPath))

  // Configure client-side hot module replacement
  clientConfig.entry.client = [
    path.resolve(__dirname, '..', 'src', 'modules', 'webpackHotDevClient'),
  ]
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

  clearConsole()

  const multiCompiler = webpack([clientConfig, serverConfig])
  const clientCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'client')
  const serverCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'server')
  const clientPromise = createCompilationPromise('client', clientCompiler, clientConfig, params)
  const serverPromise = createCompilationPromise('server', serverCompiler, serverConfig, params)

  // https://github.com/webpack/webpack-dev-middleware
  server.use(
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      quiet: true,
      watchOptions: params.watchOptions,
      stats: false,
      logLevel: params.isVerbore ? 'trace' : 'silent',
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
      appPromiseResolve = () => {
        appPromiseIsResolved = true
        resolve()
      }
    })
  })

  server.use((req, res, next) => {
    appPromise
      .then(() => {
        if (app.handle) {
          app.handle(req, res, next)
        } else {
          app.callback()(req, res, next)
        }
      })
      .catch(error => console.error(error))
  })

  function reloadApp() {
    clearCache()
    setTimeout(() => {
      /* eslint-disable no-underscore-dangle, no-undef */
      app = __non_webpack_require__(path.join(params.distPath, 'server.js')).default
      app.__beimo_addDevForceServerReload__(reloadApp)
      /* eslint-enable no-underscore-dangle, no-undef */

      console.warn(hmrPrefix, 'App has been reloaded.')
    }, 1)
  }

  function checkForUpdate(fromUpdate) {
    if (lastCompiledName !== 'hmr') {
      console.log('') // eslint-disable-line
    }

    lastCompiledName = 'hmr'
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
            console.info(hmrPrefix, 'Update applied.')
          }
          return
        }
        if (updatedModules.length === 0) {
          console.info(hmrPrefix, 'Nothing hot updated.')
        } else {
          console.info(hmrPrefix, 'Updated modules:')
          updatedModules.forEach(moduleId => console.info(hmrPrefix, `\t${moduleId}`))
          checkForUpdate(true)
        }
      })
      .catch(error => {
        if (['abort', 'fail'].includes(app.hot.status())) {
          console.warn(hmrPrefix, 'Cannot apply update.')

          reloadApp()
        } else {
          console.warn(hmrPrefix, `Update failed: ${error.stack || error.message}`)
        }
      })
  }

  serverCompiler.watch(params.watchOptions, (error, stats) => {
    if (app && !error && !stats.hasErrors()) {
      checkForUpdate().then(() => {
        appPromiseIsResolved = true
        appPromiseResolve()
      })
    }
  })

  await clientPromise
  await serverPromise

  /* eslint-disable no-underscore-dangle, no-undef */
  app = __non_webpack_require__(path.join(params.distPath, 'server.js')).default
  app.__beimo_addDevForceServerReload__(reloadApp)
  /* eslint-enable no-underscore-dangle, no-undef */

  appPromiseResolve()

  server.listen(params.port)
  console.info(`\nThe server is running at\n\t${chalk.cyan(`http://localhost:${params.port}/`)}`)
}
