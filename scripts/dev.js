import path from 'path'
import chalk from 'chalk'
import webpack from 'webpack'
import chokidar from 'chokidar'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
import OnDemandEntryHandler from '../build/on-demand-entry-handler'
import createWebpackConfig from '../build/create-webpack-config'
import createPageEntries from '../build/create-entries'
import { loadAsync, extractPagesFromRoutes } from '../build/parse-routes-map'
import clearConsole from '../build/utils/clear-console'
import { PageNotFoundError } from '../modules/router'
import { configure } from '../server/create-dev-server'
import clean from './clean'

function clearDirCache(dir) {
  // eslint-disable-next-line no-undef
  Object.keys(require.cache).forEach(modulePath => {
    if (modulePath.startsWith(dir)) {
      // eslint-disable-next-line no-undef
      delete require.cache[modulePath]
    }
  })
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
  // First clean the dist folder
  await clean(params)
  const { sourceDir, distDir, publicPath } = params

  const pagesDir = path.resolve(sourceDir, 'pages')
  const config = { watchOptions: {} }
  const RE_ASSET_PAGE = new RegExp(`^${publicPath}pages/(.+)\\.js`)
  let shouldUpdatePages = false
  let app = {}
  app.routes = await loadAsync(path.resolve(pagesDir, 'index.yml'))
  app.pages = extractPagesFromRoutes(app.routes)

  // Build all pages
  Object.assign(params, createPageEntries(params, app.pages))

  // Start watching pages
  const pagesWatcher = chokidar.watch(path.resolve(pagesDir, 'index.yml'))
  const routesWatchers = []
  pagesWatcher.on('change', () => {
    setTimeout(async () => {
      try {
        app.routes = await loadAsync(path.resolve(pagesDir, 'index.yml'))
        app.pages = extractPagesFromRoutes(app.routes)
        routesWatchers.forEach(fn => fn(app.routes, app.pages))
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
  const { clientConfig, serverConfig } = createWebpackConfig(params, app, pagesWatcher)

  // Update config to development
  // Configure client-side hot module replacement
  clientConfig.entry.client = [
    path.resolve(__dirname, '..', '..', 'client', 'webpack-hot-dev-client'),
  ]
    .concat(clientConfig.entry.client)
    .sort((a, b) => b.includes('polyfill') - a.includes('polyfill'))
  clientConfig.output.filename = clientConfig.output.filename.replace('chunkhash', 'hash')
  clientConfig.output.chunkFilename = clientConfig.output.chunkFilename.replace(
    'chunkhash',
    'hash',
  )
  clientConfig.module.rules = [
    ...clientConfig.module.rules,
    {
      test: /\.(js|jsx)(\?[^?]*)?$/,
      loader: path.resolve(__dirname, '..', 'build', 'loaders', 'hot-self-accept-loader'),
      options: { pagesDir },
      include: [
        pagesDir,
        path.join(__dirname, '..', 'defaults', 'pages'),
      ],
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
  )

  const multiCompiler = webpack([clientConfig, serverConfig])
  const clientCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'client')
  const serverCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'server')
  const compilationPromise = createCompilationPromise(multiCompiler.compilers)
  const serverWatcher = serverCompiler.watch(config.watchOptions, () => {})

  const middlewares = [
    errorOverlayMiddleware(),
    webpackDevMiddleware(clientCompiler, {
      publicPath: clientConfig.output.publicPath,
      quiet: true,
      watchOptions: config.watchOptions,
      stats: false,
      logLevel: 'silent',
    }),
    webpackHotMiddleware(clientCompiler, { log: false }),
  ]
  const [, devMiddleware] = middlewares

  await compilationPromise
  shouldUpdatePages = true

  const onDemandEntryHandler = new OnDemandEntryHandler(multiCompiler, pagesDir, app.pages, [
    devMiddleware,
    serverWatcher,
  ])

  configure(instance => {
    Object.assign(instance, app)
    app = instance

    // Override handle to run middlewares before runing
    const defaultHandle = app.handle
    app.handle = async (req, res, error) => {
      if (error) {
        return defaultHandle(req, res, error)
      }

      // Ensure page if requesting page asset
      const assetRequestMatch = RE_ASSET_PAGE.exec(req.path)
      if (assetRequestMatch) {
        try {
          await onDemandEntryHandler.ensurePage(assetRequestMatch[1])
        } catch (ensureError) {
          if (!(error instanceof PageNotFoundError)) {
            throw ensureError
          }
        }
      }

      // Run middlewares
      let miss
      let i = -1
      const runNextMiddleware = () => {
        i += 1

        // Check if reached the end
        if (i >= middlewares.length) {
          miss = true
          return null
        }

        return middlewares[i](req, res, runNextMiddleware)
      }

      runNextMiddleware()
      if (miss) {
        return defaultHandle(req, res)
      }

      return null
    }

    // Override ensurePage to build pages on demand
    const defaultEnsurePage = app.ensurePage
    app.ensurePage = page => {
      defaultEnsurePage(page)
      clearDirCache(distDir)

      return onDemandEntryHandler.ensurePage(page)
    }
  })

  require(path.resolve(params.distDir, 'server.js'))
}
