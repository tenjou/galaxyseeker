const path = require("path")
const { merge } = require("webpack-merge")
const common = require("./webpack.common.js")
const CopyPlugin = require("copy-webpack-plugin")

module.exports = merge(common, {
    mode: "production",
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    configFile: "tsconfig.build.json",
                },
            },
            {
                test: /\.html/,
                use: ["html-loader"],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: path.resolve(__dirname, "public") }],
        }),
    ],
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
})
