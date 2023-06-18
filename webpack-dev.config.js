const webpack = require('webpack')
const {RunScriptWebpackPlugin} = require('run-script-webpack-plugin')

const webpackBaseConfig = require('./webpack-base.config')
const {mergeWithRules} = require('webpack-merge')

/**  @type {import('webpack').Configuration} */
const webpackDevConfig = {
  mode: 'development',
  entry: ['webpack/hot/poll?100'],
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.ts$/],
    }),
    new RunScriptWebpackPlugin({
      name: webpackBaseConfig.output.filename,
      autoRestart: false,
    }),
  ],
}

const mergeRules = {
  entry: 'prepend',
}

const config = mergeWithRules(mergeRules)(webpackBaseConfig, webpackDevConfig)
module.exports = config