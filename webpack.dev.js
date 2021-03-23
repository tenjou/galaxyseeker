const path = require("path")
const { merge } = require("webpack-merge")
const common = require("./webpack.common.js")

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
    },
    devServer: {
        contentBase: path.resolve(__dirname, "public"),
        historyApiFallback: true,
        port: 3000,
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    getCustomTransformers: path.join(
                        __dirname,
                        "./webpack.ts-transformers.js"
                    ),
                    configFile: "tsconfig.json",
                },
            },
            {
                test: /\.html/,
                use: ["html-loader"],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf|ico)$/,
                use: "file-loader",
            },
        ],
    },
})
