import webpack from 'webpack'
import path from 'path'
import chalk from 'chalk'
import express from 'express'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
import createWebpackConfig from '../lib/createWebpackConfig'
import clean from './clean'

const hmrPrefix = `${chalk.bold.yellow('HMR ➜ ')}`
const preventClearConsole = process.argv.includes('--no-console-clear')
const clearConsole = () => {
  if (!preventClearConsole) {
    process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H')
  }
}

function createCompilationPromise(compilers) {
  return new Promise((resolve, reject) => {
    const isCompiling = {}

    compilers.forEach(compiler => {
      // compiler.hooks.compilation.tap('DevServerCompilation', () => {
      compiler.plugin('compilation', () => {
        if (!compilers.some(c => isCompiling[c.name])) {
          clearConsole()
          console.info(`${chalk.bold.cyan('WAIT')} ${chalk.cyan('Compiling...')}`)
        }

        isCompiling[compiler.name] = true
      })

      // compiler.hooks.done.tap('DevServerDone', stats => {
      compiler.plugin('done', stats => {
        isCompiling[compiler.name] = false
        const allCompiled = !compilers.some(c => isCompiling[c.name])

        if (stats.hasErrors()) {
          console.info(`${chalk.bold.red(' FAIL ')} ${compiler.name}`)
          console.info(stats.toString({ colors: true }))
        } else if (allCompiled) {
          clearConsole()
          console.info(`${chalk.bold.green('DONE')} ${
            chalk.green(`Compiled successfully in ${stats.endTime - stats.startTime}ms`)}`)
        }

        stats.compilation.warnings.forEach(warning => {
          console.warn(warning)
        })

        if (stats.hasErrors()) {
          reject(new Error('Compilation failed!'))
          return
        }

        if (allCompiled) {
          resolve(stats)
        }
      })
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
  const compilationPromise = createCompilationPromise(multiCompiler.compilers)

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

  await compilationPromise

  /* eslint-disable no-underscore-dangle, no-undef */
  app = __non_webpack_require__(path.join(params.distPath, 'server.js')).default
  app.__beimo_addDevForceServerReload__(reloadApp)
  /* eslint-enable no-underscore-dangle, no-undef */

  appPromiseResolve()

  server.listen(params.port)
  console.info(`\nThe server is running at\n\t${chalk.cyan(`http://localhost:${params.port}/`)}`)
}
