const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx', // index entry file
  output: {
    path: path.join(__dirname, "/dist"), // the bundle output path
    filename: "bundle.js", // the name of the bundle
    // publicPath: "/rnbw/", // same as the project name
  },
  devServer: {
    port: 8080 // you can change the port
  },
  resolve:
  {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'],
    alias: {
      "@config": path.resolve(__dirname, 'src/config/'),
      "@app": path.resolve(__dirname, 'src/app/'),
      "@redux": path.resolve(__dirname, 'src/_redux/'),
      "@pages": path.resolve(__dirname, 'src/pages/'),
      "@components": path.resolve(__dirname, 'src/components/'),
      "@utils": path.resolve(__dirname, 'src/utils/'),
      "@services": path.resolve(__dirname, 'src/services/'),
      "@helpers": path.resolve(__dirname, 'src/helpers/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // .ts and .tsx files
        exclude: /node_modules/, // excluding the node_modules folder
        use: {
          loader: "ts-loader",
        },
      },
      {
        test: /\.(js|jsx)$/, // .js and .jsx files
        exclude: /node_modules/, // excluding the node_modules folder
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(sa|sc|c)ss$/, // styles files
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '/src/index.html') // index html file
    }),
  ]
}