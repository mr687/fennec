const path = require('path')

const webpack = require('webpack')

const NodeExternalsPlugin = require('webpack-node-externals')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const {RunScriptWebpackPlugin} = require('run-script-webpack-plugin')

const isProduction =
  typeof process.env.NODE_ENV !== undefined &&
  process.env.NODE_ENV === 'production'
const mode = isProduction ? 'production' : 'development'
const devtool = isProduction ? false : 'inline-source-map'

console.log(`Webpack running on ${mode}`)

module.exports = {
  context: __dirname,
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  optimization: {
    minimize: false,
  },
  target: 'node',
  mode,
  devtool,
  externals: [
    NodeExternalsPlugin({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: false,
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.ts$/],
    }),
    new ForkTsCheckerWebpackPlugin({
      async: !isProduction,
    }),
    new RunScriptWebpackPlugin({name: 'server.js', autoRestart: false}),
    // new webpack.DefinePlugin({
    //   CONFIG: JSON.stringify(require('config')),
    // }),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
}
