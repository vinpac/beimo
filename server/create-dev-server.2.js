// import parseRegExp from '../build/utils/parse-regexp'

// const queue = {}

// function send(type, payload, meta) {
//   process.send({ type, payload, meta })
// }

// function clearDirCache(dir) {
//   // eslint-disable-next-line no-undef
//   Object.keys(require.cache).forEach(modulePath => {
//     if (modulePath.startsWith(dir)) {
//       // eslint-disable-next-line no-undef
//       delete require.cache[modulePath]
//     }
//   })
// }

// let sentRequestId = 0
// function sendAsync(type, payload) {
//   sentRequestId += 1

//   if (!queue[type]) {
//     queue[type] = {}
//   }

//   return new Promise(resolve => {
//     queue[type][sentRequestId] = resolve
//     send(type, payload, { id: sentRequestId })
//   })
// }

// process.on('message', action => {
//   if (queue[action.type]) {
//     const fn = queue[action.type][action.meta.id]

//     if (action.error) {
//       fn(new Error(action.payload))
//       return
//     }

//     fn(action.payload)
//   }
// })

// export default async (instance, listen) => {
//   const defaultHandle = instance.handle
//   const defaultEnsurePage = instance.ensurePage
//   let distDir

//   await sendAsync('start').then(({ distDir: nextDistDir, routerMap }) => {
//     distDir = nextDistDir
//     Object.assign(instance, {
//       ...routerMap,
//       routes: routerMap.routes.map(route => ({
//         ...route,
//         matcher: {
//           keys: route.matcher.keys,
//           re: parseRegExp(route.matcher.re),
//         },
//       })),
//     })
//   })

//   instance.ensurePage = page => {
//     defaultEnsurePage(page)
//     clearDirCache(distDir)

//     return sendAsync('ensure-page', page)
//   }

//   instance.handle = async (req, res, error) => {
//     await sendAsync('handle', {
//       method: req.method,
//       headers: req.headers,
//       url: req.url,
//       path: req.path,
//     }).then(response => {
//       if (response) {
//         const { type, body } = response

//         if (response.headers) {
//           response.headers.forEach(header => {
//             res.setHeader(...header)
//           })
//         }

//         if (type === 'buffer') {
//           res.send(Buffer.from(body.data))
//           return
//         }

//         if (type === 'json') {
//           res.json(body)
//           return
//         }

//         res.send(body)
//         return
//       }

//       defaultHandle(req, res, error)
//     })
//   }

//   return listen()
// }

// /////// ======
// import path from 'path'
// import chalk from 'chalk'
// import express from 'express'
// import webpack from 'webpack'
// import chokidar from 'chokidar'
// import { fork } from 'child_process'
// import httpShutdown from 'http-shutdown'
// import webpackDevMiddleware from 'webpack-dev-middleware'
// import webpackHotMiddleware from 'webpack-hot-middleware'
// import OnlyIfChangedPlugin from 'only-if-changed-webpack-plugin'
// import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'
// import OnDemandEntryHandler from '../build/on-demand-entry-handler'
// import createWebpackConfig from '../build/create-webpack-config'
// import createPageEntries from '../build/create-entries'
// import clearConsole from '../build/utils/clear-console'
// import loadRouterMapAsync from '../build/utils/load-router-map-async'
// import { PageNotFoundError } from '../modules/router'
// import clean from './clean'

// // Add shutdown to http servers
// httpShutdown.extend()

// function createCompilationPromise(compilers) {
//   return new Promise((resolve, reject) => {
//     const isCompiling = {}

//     compilers.forEach(compiler => {
//       // compiler.hooks.compilation.tap('DevServerCompilation', () => {
//       compiler.plugin('compilation', () => {
//         if (!compilers.some(c => isCompiling[c.name])) {
//           clearConsole()
//           console.info(`${chalk.bold.cyan('WAIT')} ${chalk.cyan('Compiling...')}`)
//         }

//         isCompiling[compiler.name] = Date.now()
//       })

//       // compiler.hooks.done.tap('DevServerDone', stats => {
//       compiler.plugin('done', stats => {
//         const compilationTime = Date.now() - isCompiling[compiler.name]
//         isCompiling[compiler.name] = null

//         const allCompiled = !compilers.some(c => isCompiling[c.name])

//         if (stats.hasErrors()) {
//           console.info(`${chalk.bold.red(' FAIL ')} ${compiler.name}`)
//           console.info(stats.toString({ colors: true }))
//         } else if (allCompiled) {
//           clearConsole()
//           console.info(
//             `${chalk.bold.green('DONE')} ${chalk.green(
//               `Compiled successfully in ${compilationTime}ms`,
//             )}`,
//           )
//         }

//         stats.compilation.warnings.forEach(warning => {
//           console.warn(warning)
//         })

//         if (stats.hasErrors()) {
//           reject(new Error('Compilation failed!'))
//           return
//         }

//         if (allCompiled) {
//           resolve(stats)
//         }
//       })
//     })
//   })
// }

// export default async params => {
//   // First clean the dist folder
//   await clean(params)
//   const { sourceDir, distDir, publicPath } = params
//   const RE_ASSET_PAGE = new RegExp(`^${publicPath}pages/(.+)\\.js`)
//   const pagesDir = path.resolve(sourceDir, 'pages')
//   const config = { watchOptions: {} }
//   let shouldUpdatePages = false
//   let routerMap = await loadRouterMapAsync(path.resolve(pagesDir, 'index.yml'))
//   let appServer
//   let runServer

//   // Build all pages
//   Object.assign(params, createPageEntries(params, []))

//   // Start watching pages
//   const pagesWatcher = chokidar.watch(path.resolve(pagesDir, 'index.yml'))
//   const routesWatchers = []
//   pagesWatcher.on('change', () => {
//     setTimeout(async () => {
//       try {
//         routerMap = await loadRouterMapAsync(path.resolve(pagesDir, 'index.yml'))
//         routesWatchers.forEach(fn => fn(routerMap.routes, routerMap.pages))
//         if (shouldUpdatePages) {
//           console.info('> Pages map changed')
//         }
//       } catch (error) {
//         if (shouldUpdatePages) {
//           console.info(chalk.red('> Failed updating pages'))
//         }
//         console.error(String(error))
//       }
//     }, 100)
//   })
//   pagesWatcher.addOnChange = fn => {
//     routesWatchers.push(fn)
//   }

//   // Define compilers
//   const { clientConfig, serverConfig } = createWebpackConfig(params, routerMap, pagesWatcher)

//   // Update config to development
//   // Configure client-side hot module replacement
//   clientConfig.entry.client = [path.resolve(__dirname, '..', 'client', 'webpack-hot-dev-client')]
//     .concat(clientConfig.entry.client)
//     .sort((a, b) => b.includes('polyfill') - a.includes('polyfill'))
//   clientConfig.output.filename = clientConfig.output.filename.replace('chunkhash', 'hash')
//   clientConfig.output.chunkFilename = clientConfig.output.chunkFilename.replace('chunkhash', 'hash')
//   clientConfig.module.rules = [
//     ...clientConfig.module.rules,
//     {
//       test: /\.(js|jsx)(\?[^?]*)?$/,
//       loader: path.resolve(__dirname, '..', 'build', 'loaders', 'hot-self-accept-loader'),
//       options: { pagesDir },
//       include: [pagesDir, path.join(__dirname, '..', 'defaults', 'pages')],
//     },
//   ]
//   clientConfig.plugins.push(
//     new webpack.HotModuleReplacementPlugin(),
//     new webpack.NoEmitOnErrorsPlugin(),
//     new webpack.NamedModulesPlugin(),
//   )

//   // Configure server-side hot module replacement
//   serverConfig.output.hotUpdateMainFilename = 'updates/[hash].hot-update.json'
//   serverConfig.output.hotUpdateChunkFilename = 'updates/[id].[hash].hot-update.js'
//   serverConfig.module.rules = serverConfig.module.rules.filter(x => x.loader !== 'null-loader')
//   serverConfig.plugins.push(
//     new webpack.HotModuleReplacementPlugin(),
//     new webpack.NoEmitOnErrorsPlugin(),
//     new webpack.NamedModulesPlugin(),
//     // new OnlyIfChangedPlugin({
//     //   cacheDirectory: path.join(path.resolve(__dirname, '..', '..'), 'tmp/cache'),
//     //   cacheIdentifier: {
//     //     rootDir: path.resolve(__dirname, '..', '..'),
//     //     devBuild: true,
//     //   },
//     // }),
//   )

//   const multiCompiler = webpack([clientConfig, serverConfig])
//   const clientCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'client')
//   const serverCompiler = multiCompiler.compilers.find(compiler => compiler.name === 'server')
//   const compilationPromise = createCompilationPromise(multiCompiler.compilers)
//   const serverWatcher = serverCompiler.watch(config.watchOptions, error => {
//     if (error) {
//       console.error(error)
//     }
//   })

//   const middlewares = [
//     errorOverlayMiddleware(),
//     webpackDevMiddleware(clientCompiler, {
//       publicPath: clientConfig.output.publicPath,
//       quiet: true,
//       watchOptions: config.watchOptions,
//       stats: false,
//       logLevel: 'silent',
//     }),
//     webpackHotMiddleware(clientCompiler, { log: false }),
//   ]
//   const [, devMiddleware] = middlewares

//   await compilationPromise
//   shouldUpdatePages = true

//   const onDemandEntryHandler = new OnDemandEntryHandler(
//     multiCompiler,
//     pagesDir,
//     [],
//     [devMiddleware, serverWatcher],
//   )

//   runServer = () => {
//     if (appServer) {
//       appServer.kill()
//       console.info('> Reload server')
//     }

//     appServer = fork(path.resolve(params.distDir, 'server.js'))
//     appServer.on('message', action => {
//       const resolve = payload => sp.resolve(action.type, payload, action.meta)
//       const reject = payload => sp.resolve(action.type, payload, action.meta)

//       switch (action.type) {
//         case 'start':
//           resolve({
//             routerMap: {
//               ...routerMap,
//               routes: routerMap.routes.map(route => ({
//                 ...route,
//                 matcher: { ...route.matcher, re: String(route.matcher.re) },
//               })),
//             },
//             distDir,
//           })
//           break
//         case 'handle':
//           handleRequest(action.payload)
//             .then(response => {
//               resolve(response)
//             })
//             .catch(reject)
//           break
//         case 'ensure-page':
//           onDemandEntryHandler
//             .ensurePage(action.payload)
//             .then(resolve)
//             .catch(reject)
//           break
//         default:
//           reject()
//           break
//       }
//     })
//   }

//   runServer()

//   process.on('exit', () => {
//     if (appServer) {
//       appServer.kill()
//     }
//   })
// }
