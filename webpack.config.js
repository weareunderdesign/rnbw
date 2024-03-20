const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MonacoEditorWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  entry: {
    // index entry file
    client: "./src/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"), // the bundle output path
    filename: "[name].bundle.js", // the name of the bundle
  },
  devServer: {
    port: 8080, // you can change the port
  },
  resolve: {
    extensions: [".csv", ".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@_node": path.resolve(__dirname, "src/_node/"),
      "@_redux": path.resolve(__dirname, "src/_redux/"),
      "@_ref": path.resolve(__dirname, "src/_ref/"),
      "@_app": path.resolve(__dirname, "src/app/"),
      "@_components": path.resolve(__dirname, "src/components/"),
      "@_constants": path.resolve(__dirname, "src/constants/"),
      "@_hooks": path.resolve(__dirname, "src/hooks/"),
      "@_pages": path.resolve(__dirname, "src/pages/"),
      "@_services": path.resolve(__dirname, "src/services/"),
      "@_types": path.resolve(__dirname, "src/types/"),
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
        test: /\.ttf$/,
        type: "asset/resource",
      },
      {
        test: /\.(png|woff|woff2|eot)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
      {
        test: /\.svg$/i,
        type: "asset",
        resourceQuery: /url/, // *.svg?url
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
        use: ["@svgr/webpack"],
      },
      {
        test: /\.csv$/,
        loader: "csv-loader",
        options: {
          dynamicTyping: true,
          header: true,
        },
      },
    ],
    exprContextCritical: false
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src/index.html"), // index html file
    }),
    new MonacoEditorWebpackPlugin(), // code-view - monaco-editor
  ],
};
