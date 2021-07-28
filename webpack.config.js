const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: "development",
  entry: './src/frontend/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index_bundle.js',
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'liveDist'),
    compress: true,
    port: 9000,
  },
  plugins: [new HtmlWebpackPlugin({
    template:"./public/index.html"
  })],
  devtool: 'cheap-module-source-map',
};
