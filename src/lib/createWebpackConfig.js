import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import AssetsPlugin from 'assets-webpack-plugin'
import StringReplacePlugin from 'string-replace-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import UglifyJSPlugin from 'uglifyjs-webpack-plugin'
import overrideRules from '../lib/overrideRules'
import postCSSConfig from './postcss.config'

const appModulesMap = [
  {
    name: 'pages',
    path: 'pages/index.js',
    source: true,
  },
  {
    name: 'configureApp',
    path: 'beimo.app.js',
  },
]

const extractTextPlugin = new ExtractTextPlugin({
  filename: '[chunkhash:8].css',
  allChunks: true,
})

export default params => {
  const {
    basePath,
    sourcePath,
    isRelease,
    isVerbose,
    distPath,
    port,
    staticDir,
    staticPath,
    has,
    parseWebpackConfig,
  } = params

  const pkg = {
    engines: {
      node: 'current',
      npm: '>=3.10',
    },
    browserslist: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
  }

  const isDev = !isRelease

  const reScript = /\.jsx?$/
  const reStyle = /\.(css|less|scss|sss|styl|sass)$/
  const reImage = /\.(bmp|gif|jpe?g|png|svg)$/
  const staticAssetName = isDev ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]'

  const appGlobals = {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
    'process.env.HAS': {
      CLIENT: has.client,
      SERVER: has.server,
      APP_CONFIGURATION: has.configureApp,
    },
    __DEV__: isDev,
  }

  const extractOptions = {
    fallback: {
      loader: 'modular-style-loader',
      options: { add: false },
    },
    use: [
      {
        loader: 'modular-css-loader',
        options: {
          // CSS Nano http://cssnano.co/options/
          minimize: true,
        },
      },
      // Apply PostCSS plugins including autoprefixer
      {
        loader: 'postcss-loader',
        options: postCSSConfig,
      },
    ],
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
            path.resolve(basePath, 'beimo.app.js'),
            path.resolve(__dirname, '..', 'src', 'entry'),
            path.resolve(__dirname, '..', 'src', 'modules'),
          ],
          rules: [
            {
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
                    '@babel/preset-env',
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
                  '@babel/preset-stage-2',
                  // Flow
                  // https://github.com/babel/babel/tree/master/packages/babel-preset-flow
                  '@babel/preset-flow',
                  // JSX
                  // https://github.com/babel/babel/tree/master/packages/babel-preset-react
                  ['@babel/preset-react', { development: isDev }],
                ],
                plugins: [
                  ['module-resolver', {
                    alias: {
                      'beimo/head': 'react-helmet',
                      'beimo/router': path.resolve(__dirname, '..', 'src', 'modules', 'Router'),
                      'beimo/page': path.resolve(__dirname, '..', 'src', 'modules', 'Router', 'buildPage'),
                      beimo: path.resolve(__dirname, '..', 'src', 'entry', 'app'),
                    },
                  }],
                  ...(isDev ? [] : [
                    // Replaces the React.createElement function with one that is more optimized for production
                    // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-inline-elements
                    '@babel/plugin-transform-react-inline-elements',
                    // Remove unnecessary React propTypes from the production build
                    // https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types
                    'transform-react-remove-prop-types',
                  ]),
                ],
              },
            },
            {
              include: [
                path.resolve(__dirname, '..', 'src', 'entry'),
              ],
              use: StringReplacePlugin.replace({
                replacements: appModulesMap.map(module => ({
                  pattern: new RegExp(
                    `'<beimo:${module.name}-path>'|"<beimo:${module.name}-path>"`,
                    'g',
                  ),
                  replacement: function replaceAppModule() {
                    let modulePath = path.join(module.source ? sourcePath : basePath, module.path)
                    if (has[module.name] === false) {
                      modulePath = path.join(__dirname, '..', 'src', 'entry', 'null')
                    }

                    return `'${path.relative(
                      path.resolve(this.resource, '..'),
                      modulePath,
                    )}'`
                  },
                })),
              }),
            },
            {
              include: [sourcePath],
              loader: path.resolve(__dirname, '..', 'src', 'loaders', 'PagesLoader'),
              options: { pagesPath: path.join(sourcePath, 'pages'), isDev },
            },
            { loader: 'thread-loader' },
          ],
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
              options: { name: staticAssetName },
            },
          ],
        },

        // Return public URL for all assets unless explicitly excluded
        // DO NOT FORGET to update `exclude` list when you adding a new loader
        {
          exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
          loader: 'file-loader',
          options: { name: staticAssetName },
        },
      ],
    },

    // Don't attempt to continue if there are any errors.
    bail: !isDev,

    cache: isDev,

    plugins: [
      // Required for string-replace-plugin loader
      new StringReplacePlugin(),
    ],

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

    name: 'server',
    target: 'node',

    entry: {
      server: [
        has.server
          ? path.join(sourcePath, 'server.js')
          : path.resolve(__dirname, '..', 'src', 'entry', 'server.js'),
      ],
    },

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
        // Rule for styles
        {
          test: reStyle,
          rules: [
            ...(isDev ? [
              {
                loader: 'modular-style-loader',
                options: { add: true, server: true },
              },
            ] : []),
            {
              loader: isRelease ? 'modular-css-loader/locals' : 'modular-css-loader',
              options: {
                sourceMap: isDev,
                // CSS Nano http://cssnano.co/options/
                minimize: false,
              },
            },
            // Apply PostCSS plugins including autoprefixer
            {
              loader: 'postcss-loader',
              options: postCSSConfig,
            },
          ],
        },
        ...overrideRules(baseConfig.module.rules, rule => {
          // Override babel-preset-env configuration for Node.js

          if (rule.loader === 'babel-loader') {
            return {
              ...rule,
              options: {
                ...rule.options,
                presets: rule.options.presets.map(preset => (
                  preset[0] !== '@babel/preset-env'
                    ? preset
                    : [
                      '@babel/preset-env',
                      {
                        targets: { node: pkg.engines.node },
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
      ...baseConfig.plugins,
      new webpack.DefinePlugin({
        ...appGlobals,
        'process.env.PORT': port,
        'process.env.DIST_PATH': `'${distPath}'`,
        'process.env.STATIC_DIR': `'${staticDir}'`,
        'process.env.STATIC_PATH': `'${isDev ? path.relative(distPath, staticPath) : staticDir}'`,
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
        '@babel/polyfill',
        has.client
          ? path.join(sourcePath, 'client')
          : path.resolve(__dirname, '..', 'src', 'entry', 'client.js'),
      ],
    },

    module: {
      ...baseConfig.module,
      rules: [
        ...baseConfig.module.rules,

        // Rules for styles
        {
          test: reStyle,
          ...isDev ? {
            // Development configuration
            rules: [
              {
                loader: 'modular-style-loader',
                options: { add: true, hmr: true },
              },
              {
                loader: 'modular-css-loader',
                options: {
                  sourceMap: true,
                  // CSS Nano http://cssnano.co/options/
                  minimize: false,
                },
              },
              // Apply PostCSS plugins including autoprefixer
              {
                loader: 'postcss-loader',
                options: postCSSConfig,
              },
            ],
          } : {
            // Release configuration
            loader: extractTextPlugin.extract(extractOptions),
          },
        },
      ],
    },

    plugins: [
      ...baseConfig.plugins,
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
          // Required plugin to extract css
          extractTextPlugin,
          // Decrease script evaluation time
          // https://github.com/webpack/webpack/blob/master/examples/scope-hoisting/README.md
          new webpack.optimize.ModuleConcatenationPlugin(),

          // Minimize all JavaScript output of chunks
          // https://github.com/mishoo/UglifyJS2#compressor-options
          new UglifyJSPlugin({
            uglifyOptions: {
              ecma: 5,
              compress: {
                warnings: isVerbose,
                // Disabled because of an issue with Uglify breaking seemingly valid code:
                // https://github.com/facebookincubator/create-react-app/issues/2376
                // Pending further investigation:
                // https://github.com/mishoo/UglifyJS2/issues/2011
                comparisons: false,
              },
              mangle: { safari10: true },
              output: {
                comments: false,
                // Turned on because emoji and regex is not minified properly using default
                // https://github.com/facebookincubator/create-react-app/issues/2488
                ascii_only: true,
              },
            },
            // Use multi-process parallel running to improve the build speed
            // Default number of concurrent runs: os.cpus().length - 1
            parallel: true,
            // Enable file caching
            cache: true,
            sourceMap: true,
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

  if (parseWebpackConfig) {
    return parseWebpackConfig({
      client: clientConfig,
      server: serverConfig,
    }, params, { extractTextPlugin, extractOptions, postCSSConfig, reStyle, reScript, reImage })
  }

  return {
    server: serverConfig,
    client: clientConfig,
  }
}
