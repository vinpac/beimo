import path from 'path'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import ParallelUglifyPlugin from 'webpack-parallel-uglify-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import postCSSConfig from './postcss.config'
import PagesPlugin from './plugins/pages-plugin'
import overrideRules from './utils/override-rules'

const RE_SCRIPT = /\.jsx?$/
const RE_STYLE = /\.(css|less|scss|sss|styl|sass)$/
const RE_IMAGE = /\.(bmp|gif|jpe?g|png|svg)$/

export default (
  {
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
  },
  { pages },
  pagesWatcher,
) => {
  const isDev = !isRelease
  const staticAssetName = isDev ? 'file/[path][name].[ext]?[hash:8]' : '[hash:8].[ext]'
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
  const extractTextPlugin = new ExtractTextPlugin({
    filename: 'style.css',
    allChunks: true,
  })

  const baseConfig = {
    context: baseDir,
    // mode: isRelease ? 'production' : 'development',

    output: {
      publicPath,
      path: distDir,
      pathinfo: isVerbose,
      filename: '[name].js',
      chunkFilename: isDev ? '[name].chunk.js' : '[name].[chunkhash:8].chunk.js',
      devtoolModuleFilenameTemplate: info => path.join(baseDir, info.absoluteResourcePath),
    },

    resolve: { alias: { '__@@BEIMO_SOURCE__': sourceDir } },

    module: {
      // Make missing exports an error instead of warning
      strictExportPresence: true,
      rules: [
        // Rules for JS / JSX
        {
          test: RE_SCRIPT,
          include: [
            sourceDir,
            path.resolve(__dirname, '..', 'server/index.js'),
            path.resolve(__dirname, '..', 'defaults'),
          ],
          rules: [
            {
              loader: 'babel-loader',
              options: {
                // https://github.com/babel/babel-loader#options
                cacheDirectory: isDev,

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
                  ...(isDev ? [] : [
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
    devtool: 'source-map',
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
      client: [
        '@babel/polyfill',
        path.resolve(__dirname, '..', 'defaults', 'client.js'),
      ],
    },

    module: {
      ...baseConfig.module,
      rules: [
        ...baseConfig.module.rules,
        // Rules for styles
        {
          test: RE_STYLE,
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
      ...(isRelease ? [
        // Required plugin to extract css
        extractTextPlugin,
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
      ] : []),
      // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
      // https://webpack.js.org/plugins/commons-chunk-plugin/
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: module => {
          if (isDev) {
            return false
          }

          return /node_modules/.test(module.resource)
        },
      }),

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
        '@babel/polyfill',
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

    externals: [nodeExternals()],

    module: {
      ...baseConfig.module,
      rules: [
        {
          test: RE_STYLE,
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
                presets: rule.options.presets.map(preset => (
                  preset[0] !== '@babel/preset-env'
                    ? preset
                    : [
                      '@babel/preset-env',
                      {
                        targets: { node: '5' },
                        modules: false,
                        useBuiltIns: false,
                        debug: false,
                      },
                    ]
                )),
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

      // Adds a banner to the top of each generated chunk
      // https://webpack.js.org/plugins/banner-plugin/
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false,
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

  return { clientConfig, serverConfig }
}
