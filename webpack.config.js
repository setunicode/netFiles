const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const VersionPlugin = require('./build/version_plugin');
const AndroidIndexPlugin = require('./build/android_index_plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webJsOptions = {
  babelrc: false,
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        useBuiltIns: 'entry',
        corejs: 3
      }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'module:nanohtml',
    ['@babel/plugin-proposal-class-properties', { loose: false }]
  ]
};

const serviceWorker = {
  target: 'webworker',
  entry: {
    serviceWorker: './app/serviceWorker.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash:8].[ext]',
          esModule: false
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash:8].[ext]',
              esModule: false
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false 
                },
                {
                  name: 'convertStyleToAttrs',
                  active: true
                },
                {
                  name: 'removeTitle',
                  active: true 
                }
              ]
            }
          }
        ]
      },
      {
        test: require.resolve('./common/generate_asset_map.js'),
        use: ['babel-loader', 'val-loader']
      }
    ]
  },
  plugins: [new webpack.IgnorePlugin(/\.\.\/dist/)]
};

const web = {
  target: 'web',
  entry: {
    app: ['./app/main.js']
  },
  output: {
    chunkFilename: '[name].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        oneOf: [
          {
            loader: 'babel-loader',
            include: [
              path.resolve(__dirname, 'app'),
              path.resolve(__dirname, 'common'),
              path.resolve(
                __dirname,
                'node_modules/@dannycoates/webcrypto-liner'
              ),
              path.resolve(__dirname, 'node_modules/@fluent'),
              path.resolve(__dirname, 'node_modules/intl-pluralrules')
            ],
            options: webJsOptions
          },
          {
            include: [path.resolve(__dirname, 'node_modules')],
            exclude: [
              path.resolve(__dirname, 'node_modules/crc'),
              path.resolve(__dirname, 'node_modules/@fluent'),
              path.resolve(__dirname, 'node_modules/@sentry'),
              path.resolve(__dirname, 'node_modules/tslib'),
              path.resolve(__dirname, 'node_modules/webcrypto-core')
            ],
            loader: 'webpack-unassert-loader'
          }
        ]
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash:8].[ext]',
          esModule: false
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash:8].[ext]',
              esModule: false
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                {
                  name: 'cleanupIDs',
                  active: false
                },
                {
                  name: 'removeViewBox',
                  active: false 
                },
                {
                  name: 'convertStyleToAttrs',
                  active: true
                },
                {
                  name: 'removeTitle',
                  active: true
                }
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                esModule: false
              }
            },
            'postcss-loader'
          ]
        })
      },
      {
        test: /\.ftl$/,
        use: 'raw-loader'
      },
      {
        test: require.resolve('./test/frontend/index.js'),
        use: ['babel-loader', 'val-loader']
      },
      {
        test: require.resolve('./common/generate_asset_map.js'),
        use: ['babel-loader', 'val-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: 'public',
          from: '*.*'
        }
      ]
    }),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.IgnorePlugin(/\.\.\/dist/),
    new ExtractTextPlugin({
      filename: '[name].[md5:contenthash:8].css'
    }),
    new VersionPlugin(), 
    new AndroidIndexPlugin(),
    new ManifestPlugin()
  ],
  devtool: 'source-map',
  devServer: {
    before:
      process.env.NODE_ENV === 'development' && require('./server/bin/dev'),
    compress: true,
    hot: false,
    host: '0.0.0.0',
    proxy: {
      '/api/ws': {
        target: 'ws://localhost:8081',
        ws: true,
        secure: false
      }
    }
  }
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  console.error(`mode: ${mode}`);
  process.env.NODE_ENV = web.mode = serviceWorker.mode = mode;
  if (mode === 'development') {
    webJsOptions.plugins.push('istanbul');
    web.entry.tests = ['./test/frontend/index.js'];
  }
  return [web, serviceWorker];
};
