module.exports = {
  plugins: ['transform-es2015-modules-commonjs'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: '6' },
        modules: false,
        useBuiltIns: false,
        debug: false,
      },
    ],
    '@babel/preset-stage-2',
    '@babel/preset-react',
  ],
}
