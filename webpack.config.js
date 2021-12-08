const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  // mode: 'development',
  // devtool: 'inline-source-map',
  // devtool: 'inline-cheap-source-map',
  entry: {
    background: './src/background.ts',
    deepl: './src/deepl.ts',
    popup: './src/popup.tsx',
    translation: './src/translation.tsx',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: {
      keep: /^\.gitignore$/,
    }
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public' },
      ],
    }),
  ],
};
