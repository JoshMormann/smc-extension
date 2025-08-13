const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      background: './src/background/background-simple.ts',
      content: './src/content/content.ts',
      popup: './src/popup/popup.ts',
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            // Always extract CSS so files like content.css exist for the extension
            MiniCssExtractPlugin.loader,
            'css-loader',
          ],
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
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'manifest.json',
            to: 'manifest.json',
          },
          {
            from: 'icons',
            to: 'icons',
            noErrorOnMissing: true,
          },
        ],
      }),
      
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
      
      // Always emit CSS files (both dev and prod)
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
    ],
    
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
  };
};
