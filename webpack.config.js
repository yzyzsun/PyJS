const webpack = require('webpack');

module.exports = {
  entry: './docs.js',
  output: {
    path: './docs',
    filename: 'bundle.js',
  },
  node: {
    fs: 'empty',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel' },
      { test: /\.css$/, loader: 'style!css' },
    ],
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
  ],
};
