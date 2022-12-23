const path = require('path')

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const webpack = require('webpack')
const NodeExternalsPlugin = require('webpack-node-externals')

const isProduction = typeof process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'production'
const mode = isProduction ? 'production' : 'development'
const devtool = isProduction ? false : 'inline-source-map'

console.log(`Webpack running on ${mode}`)

module.exports = {
  context: __dirname,
  entry: ['./src/main.ts'],
  optimization: {
    minimize: false,
  },
  target: 'node',
  mode,
  devtool,
  externals: [NodeExternalsPlugin()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules|test/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: !isProduction,
    }),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
  },
}
