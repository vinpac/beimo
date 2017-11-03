/* eslint-disable prefer-template */

const webpack = require('webpack')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const utils = require('./utils')

const isDev = !process.argv.includes('--release')
const isVerbose = process.argv.includes('--verbose')

const compiler = webpack({
  name: 'cli',
  target: 'node',

  entry: { cli: './scripts/index.js' },

  output: {
    pathinfo: isVerbose,
    devtoolModuleFilenameTemplate: info => path.resolve(info.absoluteResourcePath),
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: 'chunks/[name].js',
    libraryTarget: 'commonjs2',
  },

  externals: [
    nodeExternals(),
  ],

  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,
    rules: [
      // Rules for JS / JSX
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'scripts'),
          path.resolve(__dirname, 'lib'),
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
                targets: { node: '6.0.0' },
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
          ],
        },
      },
    ],
  },

  devtool: 'cheap-module-inline-source-map',

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
})

const timeStart = new Date()
compiler.run((error, stats) => {
  const elapsedTime = (new Date() - timeStart) + 'ms'

  if (error) {
    utils.logEvent('Transpile', 'Failed in ' + elapsedTime, 'red')

    throw error
  }

  utils.logEvent('Transpile', 'Transpiled successfully ' + elapsedTime)

  if (!process.argv.includes('--supress-stats')) {
    console.info(stats.toString({
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
    }))
  }
})
