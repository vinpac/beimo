module.exports = {
  presets: [
    [
      'env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    'stage-2',
    'flow',
  ],
  ignore: ['node_modules', 'build'],
};
