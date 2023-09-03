const path = require('path')
const NodeExternalsPlugin = require('webpack-node-externals')

const {main: mainFile} = require('./package.json')

const isProduction = process.env.NODE_ENV === 'production'
const mode = isProduction ? 'production' : 'development'
const devtool = isProduction ? false : 'inline-source-map'

const nestSWCDefaultOptions =
  require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory()
    .swcOptions
const defaultSWCOptions = {
  sourceMaps: false,
  module: {
    type: 'commonjs',
    strict: true,
  },
  jsc: {
    target: 'es2020',
    parser: {
      syntax: 'typescript',
      decorators: true,
    },
    transform: {
      legacyDecorator: true,
      decoratorMetadata: true,
    },
    keepClassNames: true,
  },
}

/**  @type {import('webpack').Configuration} */
const webpackBaseConfig = {
  entry: [path.resolve(process.cwd(), './src/main.ts')],
  mode: mode,
  devtool: devtool,
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/u,
        use: [
          {
            loader: 'swc-loader',
            options: {...nestSWCDefaultOptions, ...defaultSWCOptions},
          },
        ],
        exclude: /(node_modules)/u,
      },
    ],
  },
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(process.cwd(), '.build_cache'),
    allowCollectingMemory: true,
  },
  externalsPresets: {node: true},
  externals: [
    NodeExternalsPlugin({
      modulesFromFile: true,
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  plugins: [],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  output: {
    path: path.resolve(process.cwd(), path.dirname(mainFile)),
    filename: path.basename(mainFile),
  },
}

module.exports = webpackBaseConfig
