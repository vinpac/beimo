import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import AssetsPlugin from 'assets-webpack-plugin'
import overrideRules from './overrideRules'

export default ({ basePath, sourcePath, isRelease, isVerbose, distDir, port, staticDir }) => {
  const pkg = {
    engines: {
      node: '>=6.5',
      npm: '>=3.10',
    },
    browserslist: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
  }

  const hasServer = fs.existsSync(path.join(sourcePath, 'server.js'))
  const hasClient = fs.existsSync(path.join(sourcePath, 'client.js'))
  const hasPages = fs.existsSync(path.join(sourcePath, 'pages', 'index.js'))
  const hasRoutes = fs.existsSync(path.join(sourcePath, 'routes', 'index.js'))
  const distPath = path.join(basePath, distDir)

  if ((!hasServer || !hasClient) && !hasPages) {
    throw new Error(
      `You must create a ${chalk.green('pages/index.js')} file if no server or client is provided`,
    )
  }

  const isDev = !isRelease

  const reScript = /\.jsx?$/
  const reStyle = /\.(css|less|scss|sss)$/
  const reImage = /\.(bmp|gif|jpe?g|png|svg)$/
  const staticAssetName = isDev ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]'

  const appGlobals = {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
    'process.env.HAS': {
      CLIENT: hasClient,
      SERVER: hasServer,
      ROUTES: hasRoutes,
    },
    __DEV__: isDev,
  }

  // Base config ===================================================================================
  const baseConfig = {
    context: basePath,

    output: {
      path: path.join(distPath, staticDir, 'assets'),
      publicPath: '/assets/',
      pathinfo: isVerbose,
      filename: isDev ? '[name].js' : '[name].[chunkhash:8].js',
      chunkFilename: isDev ? '[name].chunk.js' : '[name].[chunkhash:8].chunk.js',
      devtoolModuleFilenameTemplate: info => path.join(basePath, info.absoluteResourcePath),
    },

    module: {
      // Make missing exports an error instead of warning
      strictExportPresence: true,
      rules: [
        // Rules for JS / JSX
        {
          test: reScript,
          include: [
            sourcePath,
            path.resolve(__dirname, '..', '.beimo'),
            path.resolve(__dirname, '..', 'lib'),
          ],
          loader: 'babel-loader',
          options: {
            // https://github.com/babel/babel-loader#options
            cacheDirectory: isDev,

            // https://babeljs.io/docs/usage/options/
            babelrc: false,

            presets: [
              // A Babel preset that can automatically determine the Babel plugins and polyfills
              // https://github.com/babel/babel-preset-env
              [
                'env',
                {
                  targets: {
                    browsers: pkg.browserslist,
                    forceAllTransforms: !isDev, // for UglifyJS
                  },
                  modules: false,
                  useBuiltIns: false,
                  debug: false,
                },
              ],
              // Experimental ECMAScript proposals
              // https://babeljs.io/docs/plugins/#presets-stage-x-experimental-presets-
              'stage-2',
              // Flow
              // https://github.com/babel/babel/tree/master/packages/babel-preset-flow
              'flow',
              // JSX
              // https://github.com/babel/babel/tree/master/packages/babel-preset-react
              'react',
            ],
            plugins: [
              // require.resolve('styled-jsx/babel'),
              // Adds component stack to warning messages
              // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-source
              ...(isDev ? ['transform-react-jsx-source'] : []),
              // Adds __self attribute to JSX which React will use for some warnings
              // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-self
              ...(isDev ? ['transform-react-jsx-self'] : []),
            ],
          },
        },

        // Rules for images
        {
          test: reImage,
          oneOf: [
            // Inline lightweight images into CSS
            {
              issuer: reStyle,
              oneOf: [
                // Inline lightweight SVGs as UTF-8 encoded DataUrl string
                {
                  test: /\.svg$/,
                  loader: 'svg-url-loader',
                  options: {
                    name: staticAssetName,
                    limit: 4096, // 4kb
                  },
                },

                // Inline lightweight images as Base64 encoded DataUrl string
                {
                  loader: 'url-loader',
                  options: {
                    name: staticAssetName,
                    limit: 4096, // 4kb
                  },
                },
              ],
            },

            // Or return public URL to image resource
            {
              loader: 'file-loader',
              options: {
                name: staticAssetName,
              },
            },
          ],
        },

        // Return public URL for all assets unless explicitly excluded
        // DO NOT FORGET to update `exclude` list when you adding a new loader
        {
          exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
          loader: 'file-loader',
          options: {
            name: staticAssetName,
          },
        },
      ],
    },

    // Don't attempt to continue if there are any errors.
    bail: !isDev,

    cache: isDev,

    // Specify what bundle information gets displayed
    // https://webpack.js.org/configuration/stats/
    stats: {
      cached: isVerbose,
      cachedAssets: isVerbose,
      chunks: isVerbose,
      chunkModules: isVerbose,
      colors: true,
      hash: isVerbose,
      modules: isVerbose,
      reasons: isDev,
      timings: true,
      version: isVerbose,
    },

    // Choose a developer tool to enhance debugging
    // https://webpack.js.org/configuration/devtool/#devtool
    devtool: isDev ? 'cheap-module-inline-source-map' : 'source-map',
  }

  // Server config =================================================================================
  const serverConfig = {
    ...baseConfig,

    entry: {
      server: [
        hasServer
          ? path.join(sourcePath, 'server.js')
          : path.resolve(__dirname, '..', '.beimo', 'server.js'),
      ],
    },

    name: 'server',
    target: 'node',

    output: {
      ...baseConfig.output,
      path: distPath,
      filename: '[name].js',
      chunkFilename: 'chunks/[name].js',
      libraryTarget: 'commonjs2',
    },

    externals: ['./assets.json', '../assets.json', nodeExternals()],

    module: {
      ...baseConfig.module,
      rules: [
        ...overrideRules(baseConfig.module.rules, rule => {
          // Override babel-preset-env configuration for Node.js
          if (rule.loader === 'babel-loader') {
            return {
              ...rule,
              options: {
                ...rule.options,
                presets: rule.options.presets.map(preset => (
                  preset[0] !== 'env'
                    ? preset
                    : [
                      'env',
                      {
                        targets: { node: pkg.engines.node.match(/(\d+\.?)+/)[0] },
                        modules: false,
                        useBuiltIns: false,
                        debug: false,
                      },
                    ]
                )),
              },
            }
          }

          return rule
        }),
      ],
    },

    plugins: [
      new webpack.DefinePlugin({
        ...appGlobals,
        'process.env.PORT': port,
        'process.env.STATIC_DIR': `'${staticDir}'`,
        'process.env.BROWSER': false,
        __DEV__: isDev,
      }),

      // Adds a banner to the top of each generated chunk
      // https://webpack.js.org/plugins/banner-plugin/
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false,
      }),
    ],

    // Do not replace node globals with polyfills
    // https://webpack.js.org/configuration/node/
    node: {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false,
    },
  }

  // Client config =================================================================================
  const clientConfig = {
    ...baseConfig,

    name: 'client',
    target: 'web',

    entry: {
      client: [
        'babel-polyfill',
        hasClient
          ? path.join(sourcePath, 'client.js')
          : path.resolve(__dirname, '..', '.beimo', 'client.js'),
      ],
    },

    plugins: [
      new webpack.DefinePlugin({
        ...appGlobals,
        'process.env.BROWSER': true,
      }),

      // Emit a file with assets paths
      // https://github.com/sporto/assets-webpack-plugin#options
      new AssetsPlugin({
        path: distPath,
        filename: 'assets.json',
        prettyPrint: true,
      }),

      // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
      // https://webpack.js.org/plugins/commons-chunk-plugin/
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: module => /node_modules/.test(module.resource),
      }),

      // If release
      ...(!isDev
        ? [
          // Decrease script evaluation time
          // https://github.com/webpack/webpack/blob/master/examples/scope-hoisting/README.md
          new webpack.optimize.ModuleConcatenationPlugin(),

          // Minimize all JavaScript output of chunks
          // https://github.com/mishoo/UglifyJS2#compressor-options
          new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
              screw_ie8: true, // React doesn't support IE8
              warnings: isVerbose,
              unused: true,
              dead_code: true,
            },
            mangle: { screw_ie8: true },
            output: {
              comments: false,
              screw_ie8: true,
            },
          }),
        ]
        : []),
    ],

    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    // https://webpack.js.org/configuration/node/
    // https://github.com/webpack/node-libs-browser/tree/master/mock
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
    },
  }

  return {
    server: serverConfig,
    client: clientConfig,
  }
}
