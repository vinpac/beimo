import path from 'path'
import chalk from 'chalk'
import express from 'express'
import webpack from 'webpack'
import chokidar from 'chokidar'
import { fork } from 'child_process'
import httpShutdown from 'http-shutdown'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import OnlyIfChangedPlugin from 'only-if-changed-webpack-plugin'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
import OnDemandEntryHandler from '../build/on-demand-entry-handler'
import createWebpackConfig from '../build/create-webpack-config'
import createPageEntries from '../build/create-entries'
import { loadAsync, extractPagesFromRoutes } from '../build/parse-routes-map'
import clearConsole from '../build/utils/clear-console'
import { PageNotFoundError } from '../modules/router'
import clean from './clean'

// Add shutdown to http servers
httpShutdown.extend()

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

        isCompiling[compiler.name] = Date.now()
      })

      // compiler.hooks.done.tap('DevServerDone', stats => {
      compiler.plugin('done', stats => {
        const compilationTime = Date.now() - isCompiling[compiler.name]
        isCompiling[compiler.name] = null

        const allCompiled = !compilers.some(c => isCompiling[c.name])

        if (stats.hasErrors()) {
          console.info(`${chalk.bold.red(' FAIL ')} ${compiler.name}`)
          console.info(stats.toString({ colors: true }))
        } else if (allCompiled) {
          clearConsole()
          console.info(
            `${chalk.bold.green('DONE')} ${chalk.green(
              `Compiled successfully in ${compilationTime}ms`,
            )}`,
          )
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
  // First clean the dist folder
  await clean(params)
  const { sourceDir, distDir, publicPath } = params

  const pagesDir = path.resolve(sourceDir, 'pages')
  const config = { watchOptions: {} }
  const RE_ASSET_PAGE = new RegExp(`^${publicPath}pages/(.+)\\.js`)
  let hasEverBuiltServer = false
  let shouldUpdatePages = false
  const router = {}
  let appServer
  let runServer
  let pagesModuleRe
  const updatePagesModuleRe = () => {
    pagesModuleRe = new RegExp(
      `${path.join('pages', `${[...router.pages, '_app', '_error', '_document'].join('|')}.js`)}$`,
    )
  }

  // Pages
  router.routes = await loadAsync(path.resolve(pagesDir, 'index.yml'))
  router.pages = extractPagesFromRoutes(router.routes)
  updatePagesModuleRe()

  // Build all pages
  Object.assign(params, createPageEntries(params, []))

  // Start watching pages
  const pagesWatcher = chokidar.watch(path.resolve(pagesDir, 'index.yml'))
  const routesWatchers = []
  pagesWatcher.on('change', () => {
    setTimeout(async () => {
      try {
        router.routes = await loadAsync(path.resolve(pagesDir, 'index.yml'))
        router.pages = extractPagesFromRoutes(router.routes)
        routesWatchers.forEach(fn => fn(router.routes, router.pages))
        updatePagesModuleRe()
        if (shouldUpdatePages) {
          console.info('> Pages map changed')
        }
      } catch (error) {
        if (shouldUpdatePages) {
          console.info(chalk.red('> Failed updating pages'))
        }
        console.error(String(error))
      }
    }, 100)
  })
  pagesWatcher.addOnChange = fn => {
    routesWatchers.push(fn)
  }

  // Define compilers
  const { clientConfig, serverConfig } = createWebpackConfig(params, router, pagesWatcher)

  // Update config to development
  // Configure client-side hot module replacement
  clientConfig.entry.client = [
    'webpack-hot-middleware/client?path=http://localhost:3001/__webpack_hmr',
  ]
    .concat(clientConfig.entry.client)
    .sort((a, b) => b.includes('polyfill') - a.includes('polyfill'))
  clientConfig.output.filename = clientConfig.output.filename.replace('chunkhash', 'hash')
  clientConfig.output.chunkFilename = clientConfig.output.chunkFilename.replace('chunkhash', 'hash')
  clientConfig.module.rules = [
    ...clientConfig.module.rules,
    {
      test: /\.(js|jsx)(\?[^?]*)?$/,
      loader: path.resolve(__dirname, '..', 'build', 'loaders', 'hot-self-accept-loader'),
      options: { pagesDir },
      include: [pagesDir, path.join(__dirname, '..', 'defaults', 'pages')],
    },
  ]
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
    // new OnlyIfChangedPlugin({
    //   cacheDirectory: path.join(path.resolve(__dirname, '..', '..'), 'tmp/cache'),
    //   cacheIdentifier: {
    //     rootDir: path.resolve(__dirname, '..', '..'),
    //     devBuild: true,
    //   },
    // }),
  )

  const multiCompiler = webpack([clientConfig, serverConfig])
  const clientCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'client')
  const serverCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'server')
  const compilationPromise = createCompilationPromise(multiCompiler.compilers)
  const serverWatcher = serverCompiler.watch(config.watchOptions, (error, stats) => {
    if (!hasEverBuiltServer) {
      hasEverBuiltServer = true
      return
    }

    const keys = Object.keys(serverWatcher.compiler.watchFileSystem.watcher.mtimes)

    if (keys.some(modulePath => !pagesModuleRe.test(modulePath))) {
      runServer()
    }
  })

  const middlewares = [
    errorOverlayMiddleware(),
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      quiet: true,
      watchOptions: config.watchOptions,
      stats: false,
      logLevel: 'silent',
    }),
  ]
  const [, devMiddleware] = middlewares
  const hotServer = express()
  hotServer.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
  })
  hotServer.use(devMiddleware)
  hotServer.use(webpackHotMiddleware(clientCompiler, { log: false }))
  hotServer.listen(3001, () => console.info('Hot server listening at http://localhost:3001'))

  await compilationPromise
  shouldUpdatePages = true

  const onDemandEntryHandler = new OnDemandEntryHandler(
    multiCompiler,
    pagesDir,
    [],
    [devMiddleware, serverWatcher],
  )

  const handleRequest = req => {
    return new Promise(async (resolve, reject) => {
      const assetRequestMatch = RE_ASSET_PAGE.exec(req.path)
      if (assetRequestMatch) {
        try {
          await onDemandEntryHandler.ensurePage(assetRequestMatch[1])
        } catch (error) {
          if (!(error instanceof PageNotFoundError)) {
            throw error
          }
        }
      }

      const headers = []
      const res = {
        json: payload => resolve({ type: 'json', headers, body: JSON.stringify(payload) }),
        send: body => {
          if (body instanceof Buffer) {
            resolve({ type: 'buffer', headers, body })
          } else {
            resolve({ type: 'text', headers, body })
          }
        },
        setHeader: (...args) => {
          headers.push(args)
        },
      }
      let i = -1
      const next = () => {
        i += 1
        if (!middlewares[i]) {
          resolve(null)
          return
        }

        middlewares[i](req, res, next)
      }

      next()
    })
  }

  // Configure server process
  const sp = {
    resolve: (type, payload, meta) => appServer.send({ type, payload, meta }),
    reject: (type, payload, meta) => appServer.send({ type, payload, meta, error: true }),
  }
  runServer = () => {
    if (appServer) {
      appServer.kill()
      console.info('> Reload server')
    }

    appServer = fork(path.resolve(params.distDir, 'server.js'))
    appServer.on('message', action => {
      const resolve = payload => sp.resolve(action.type, payload, action.meta)
      const reject = payload => sp.resolve(action.type, payload, action.meta)

      switch (action.type) {
        case 'start':
          resolve({ ...router, distDir })
          break
        case 'handle':
          handleRequest(action.payload)
            .then(response => {
              resolve(response)
            })
            .catch(reject)
          break
        case 'ensure-page':
          onDemandEntryHandler
            .ensurePage(action.payload)
            .then(resolve)
            .catch(reject)
          break
        default:
          reject()
          break
      }
    })
  }

  runServer()

  process.on('exit', () => {
    if (appServer) {
      appServer.kill()
    }
  })
}
