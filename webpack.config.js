const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const { VueLoaderPlugin } = require("vue-loader");

/** @type {import("webpack").Configuration} */
module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/index.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "[contenthash].js" : "[name].js",
      // Add this to ensure workers are properly loaded
      globalObject: "self",
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          options: { appendTsSuffixTo: [/\.vue$/] },
        },
        {
          test: /\.vue$/,
          loader: "vue-loader",
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCSSExtractPlugin.loader : "style-loader",
            { loader: "css-loader", options: { importLoaders: 1 } },
            "postcss-loader",
          ],
        },
        {
          test: /\.png$/,
          loader: "url-loader",
        },
      ],
    },
    resolve: { extensions: [".js", ".ts", ".vue"] },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({ patterns: [{ from: "public" }] }),
      new HTMLWebpackPlugin({ template: "index.html" }),
      isProduction &&
        new MiniCSSExtractPlugin({ filename: "[contenthash].css" }),
      new VueLoaderPlugin(),
    ].filter(Boolean),
    experiments: {
      asyncWebAssembly: true,
    },
    devtool: isProduction ? false : "eval-source-map",
    devServer: {
      static: {
        directory: path.join(__dirname, "public"),
      },
      hot: true,
      port: 8080,
      historyApiFallback: true,
      compress: true,
    },
    optimization: {
      minimize: isProduction,
      // Modified optimization configuration
      splitChunks: {
        chunks: "all",
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          // Separate vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Get the package name
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `vendors/${packageName.replace("@", "")}`;
            },
          },
          // Separate WASM modules completely
          wasm: {
            test: /[\\/]pkg[\\/]/,
            name(module) {
              const moduleName = module.context.match(
                /[\\/]pkg[\\/](.*?)([\\/]|$)/
              )[1];
              return `wasm/${moduleName}`;
            },
            priority: 20,
          },
        },
      },
      // Disable runtime chunk in dev to prevent circular dependencies
      runtimeChunk: false,
    },
  };
};
