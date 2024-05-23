// vue.config.js
import path from 'path';

export default {
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

