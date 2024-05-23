const path = require('path');

module.exports = {
  transpileDependencies: ['pdfjs-dist'],
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: { loader: 'worker-loader' },
        },
      ],
    },
  },
};
