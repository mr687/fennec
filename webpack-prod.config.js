process.env.NODE_ENV = 'production'

const {mergeWithRules} = require('webpack-merge')
const TerserPlugin = require('terser-webpack-plugin')

const webpackBaseConfig = require('./webpack-base.config')

/**  @type {import('webpack').Configuration} */
const webpackProdConfig = {
  mode: 'production',
  module: {
    rules: [
      {
        use: [
          {
            loader: webpackBaseConfig.module.rules[0].use[0].loader,
            options: {
              minify: true,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          keep_classnames: true,
          mangle: false,
        },
      }),
    ],
  },
}

const mergeRules = {
  module: {
    rules: {
      use: {
        loader: 'match',
        options: 'merge',
      },
    },
  },
}

const config = mergeWithRules(mergeRules)(webpackBaseConfig, webpackProdConfig)
module.exports = config
