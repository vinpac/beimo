const path = require('path')

module.exports = {
  webpack: ({ client, server }, { isRelease }, { extractTextPlugin, reStyle }) => {

    const extractOptions = {
      fallback: {
        loader: path.resolve(__dirname, '..', '..', 'lib', 'style-loader', 'dist'),
        options: { add: false },
      },
      use: [
        {
          loader: 'css-modular-loader',
          options: {
            // CSS Nano http://cssnano.co/options/
            minimize: true,
          },
        },
      ],
    }

    client.module.rules = client.module.rules.map(rule => {
      if (rule.test === reStyle) {
        if (isRelease) {
          return {
            test: reStyle,
            rules: [
              {
                test: /\.css$/,
                loader: extractTextPlugin.extract(extractOptions),
              },
              {
                test: /\.sass$/,
                loader: extractTextPlugin.extract(Object.assign({}, extractOptions, {
                  use: extractOptions.use.concat([
                    { loader: 'sass-loader' },
                  ]),
                })),
              },
            ],
          }
        }

        return {
          test: reStyle,
          rules: rule.rules.concat([
            {
              test: /\.sass$/,
              loader: 'sass-loader',
            },
          ]),
        }
      }

      return rule
    })

    server.module.rules = server.module.rules.map(rule => {
      if (rule.test === reStyle) {
        return Object.assign({}, rule, {
          rules: rule.rules.concat([
            {
              test: /\.sass$/,
              loader: 'sass-loader',
            },
          ]),
        })
      }

      return rule
    })

    return {
      server,
      client,
    }
  },
  files: [
    'LICENSE.txt',
  ],
}
