import path, { sep } from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import ParallelUglifyPlugin from 'webpack-parallel-uglify-plugin'
import postCSSConfig from './postcss.config'
import PagesPlugin from './plugins/pages-plugin'
import overrideRules from './utils/override-rules'

const RE_SCRIPT = /\.jsx?$/
const RE_STYLE = /\.(css|less|scss|sss|styl|sass)$/
const RE_IMAGE = /\.(bmp|gif|jpe?g|png|svg)$/

export default (params, { pages }, pagesWatcher) => {
  const {
    webpack: configMapper,
    baseDir,
    distDir,
    sourceDir,
    staticDir,
    buildId,
    publicPath,
    clientEntries,
    serverEntries,
    isRelease,
    isVerbose,
    overrideServer,
  } = params
  const totalPages = pages.length
  const isDev = !isRelease
  const staticAssetName = isDev ? 'file/[path][name].[ext]?[hash:8]' : '[hash:8].[ext]'

  const baseConfig = {
    context: baseDir,

    output: {
      publicPath,
      path: distDir,
      pathinfo: isVerbose,
      filename: '[name].js',
      chunkFilename: '[name]-[chunkhash].js',
      strictModuleExceptionHandling: true,
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },

    performance: { hints: false },

    resolve: { alias: { '__@@BEIMO_SOURCE__': sourceDir } },

    module: {
      // Make missing exports an error instead of warning
      strictExportPresence: true,
      rules: [
        // Rules for JS / JSX
        {
          test: RE_SCRIPT,
          include: [sourceDir, path.resolve(__dirname, '..', 'defaults')],
          rules: [
            {
              loader: 'babel-loader',
              options: {
                // https://github.com/babel/babel-loader#options
                cacheDirectory: isDev,
                babelrc: false,

                compact: false,

                presets: [
                  // A Babel preset that can automatically determine the Babel plugins and polyfills
                  // https://github.com/babel/babel-preset-env
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      useBuiltIns: false,
                      debug: false,
                    },
                  ],
                  // Experimental ECMAScript proposals
                  // https://babeljs.io/docs/plugins/#presets-stage-x-experimental-presets-
                  '@babel/preset-stage-2',
                  // JSX
                  // https://github.com/babel/babel/tree/master/packages/babel-preset-react
                  ['@babel/preset-react', { development: isDev }],
                ],

                plugins: [
                  ...(isDev
                    ? []
                    : [
                        // Replaces the React.createElement function with one that is more optimized
                        // for production
                        // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-inline-elements
                        '@babel/plugin-transform-react-inline-elements',
                        // Remove unnecessary React propTypes from the production build
                        // https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types
                        'transform-react-remove-prop-types',
                      ]),
                ],
              },
            },
          ],
        },

        // Rules for yaml
        {
          test: /\.yml$/,
          include: [path.resolve(sourceDir, 'pages', 'index.yml')],
          loader: path.resolve(__dirname, 'loaders', 'pages-map-loader'),
          options: { isClient: true },
        },

        // Rules for images
        {
          test: RE_IMAGE,
          oneOf: [
            // Inline lightweight images into CSS
            {
              issuer: RE_STYLE,
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
          exclude: [RE_SCRIPT, RE_STYLE, RE_IMAGE, /\.json$/, /\.txt$/, /\.md$/, /\.yml$/],
          loader: 'file-loader',
          options: { name: staticAssetName },
        },
      ],
    },

    plugins: [],

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
    devtool: isDev ? 'cheap-module-eval-source-map' : 'source-map',
  }

  const clientConfig = {
    ...baseConfig,

    name: 'client',
    target: 'web',
    output: {
      ...baseConfig.output,
      path: path.join(distDir, staticDir, '_beimo_', buildId),
    },

    entry: {
      ...clientEntries,
      client: ['@babel/polyfill', path.resolve(__dirname, '..', 'defaults', 'client.js')],
    },

    module: {
      ...baseConfig.module,
      rules: [
        ...baseConfig.module.rules,
        // Rules for styles
        {
          test: RE_STYLE,
          rules: [
            {
              loader: 'modular-style-loader',
              options: { add: false, onChange: isDev, exportCSS: true, hmr: isDev },
            },
            {
              loader: 'modular-css-loader',
              options: {
                sourceMap: true,
                // CSS Nano http://cssnano.co/options/
                minimize: !isDev,
              },
            },
            // Apply PostCSS plugins including autoprefixer
            {
              loader: 'postcss-loader',
              options: postCSSConfig,
            },
          ],
        },
      ],
    },

    plugins: [
      ...baseConfig.plugins,
      ...(isRelease
        ? [
            // Decrease script evaluation time
            // https://github.com/webpack/webpack/blob/master/examples/scope-hoisting/README.md
            new webpack.optimize.ModuleConcatenationPlugin(),

            new ParallelUglifyPlugin({
              cache: path.resolve(distDir, 'cache'),
              sourceMap: true,
              uglifyES: {
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
            }),
          ]
        : []),

      // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
      // https://webpack.js.org/plugins/commons-chunk-plugin/
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        filename: 'vendor.js',
        minChunks: (module, count) => {
          // React and React DOM are used everywhere in Next.js. So they should always be common.
          // Even in development mode, to speed up compilation.
          if (module.resource && module.resource.includes(`${sep}react-dom${sep}`) && count >= 0) {
            return true
          }

          if (module.resource && module.resource.includes(`${sep}react${sep}`) && count >= 0) {
            return true
          }

          // In the dev we use on-demand-entries.
          // So, it makes no sense to use commonChunks based on the minChunks count.
          // Instead, we move all the code in node_modules into each of the pages.
          if (isDev) {
            return false
          }

          // commons
          // If there are one or two pages, only move modules to common if they are
          // used in all of the pages. Otherwise, move modules used in at-least
          // 1/2 of the total pages into commons.
          if (totalPages <= 2) {
            return count >= totalPages
          }
          return count >= totalPages * 0.5
          // commons end
        },
      }),

      ...(isDev
        ? [
            // We use a manifest file in development to speed up HMR
            new webpack.optimize.CommonsChunkPlugin({
              name: 'manifest',
              filename: 'manifest.js',
            }),
          ]
        : []),

      new PagesPlugin(pages, pagesWatcher),
      new webpack.DefinePlugin({
        __DEV__: isDev,
        'process.env.BUILD_ID': `'${buildId}'`,
        'process.env.BROWSER': true,
      }),
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

  const serverConfig = {
    ...baseConfig,

    name: 'server',
    target: 'node',

    entry: {
      ...serverEntries,
      server: [
        overrideServer
          ? path.resolve(sourceDir, 'server.js')
          : path.resolve(__dirname, '..', 'defaults', 'server.js'),
      ],
    },

    output: {
      ...baseConfig.output,
      chunkFilename: 'chunks/[name].js',
      libraryTarget: 'commonjs2',
    },

    externals: [nodeExternals({ whitelist: ['beimo'] })],

    module: {
      ...baseConfig.module,
      rules: [
        {
          test: RE_STYLE,
          rules: [
            {
              loader: 'modular-style-loader',
              options: { exportCSS: true, server: true },
            },
            {
              loader: 'modular-css-loader',
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

          if (rule.loader && rule.loader.endsWith('pages-map-loader')) {
            return {
              ...rule,
              options: { isClient: false },
            }
          }

          if (rule.loader === 'babel-loader') {
            return {
              ...rule,
              options: {
                ...rule.options,
                presets: rule.options.presets.map(
                  preset =>
                    preset[0] !== '@babel/preset-env'
                      ? preset
                      : [
                          '@babel/preset-env',
                          {
                            targets: { node: 'current' },
                            modules: false,
                            useBuiltIns: false,
                            debug: false,
                          },
                        ],
                ),
              },
            }
          }

          // Override paths to static assets
          if (
            rule.loader === 'file-loader' ||
            rule.loader === 'url-loader' ||
            rule.loader === 'svg-url-loader'
          ) {
            return {
              ...rule,
              options: {
                ...rule.options,
                emitFile: false,
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
        __DEV__: isDev,
        'process.env.BROWSER': false,
        'process.env.BUILD_ID': `'${buildId}'`,
        'process.env.REL_STATIC_DIR': `'${isRelease ? '.' : '..'}/${staticDir}'`,
        'process.env.CREATE_DEV_SERVER_PATH': isRelease
          ? 'undefined'
          : `'${path.resolve(__dirname, '..', 'server', 'create-dev-server')}'`,
      }),
    ],

    node: {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false,
    },
  }

  if (configMapper) {
    const parseConfig = config =>
      configMapper(config, {
        ...params,
        pages,
        postCSSConfig,
        RE_STYLE,
        RE_SCRIPT,
        RE_IMAGE,
      })

    return {
      clientConfig: parseConfig(clientConfig),
      serverConfig: parseConfig(serverConfig),
    }
  }

  return { clientConfig, serverConfig }
}
