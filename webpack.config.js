const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyPlugin = require("copy-webpack-plugin");
const { readFileSync, writeFileSync } = require("fs")

function fileNameGen(folder) {
    return {
        filename: `${folder}/[contenthash][ext][query]`
    }
}

module.exports = (env, argv) => {
    var devMode = argv.mode === "development"

    let publicPath = env.WEBPACK_SERVE ? "" : "/" + (env["publicpath"] ?? "");
    if(publicPath == "/") publicPath = "";

    let outputPath = path.resolve(__dirname, "dist");

    let publicPathForStupidOne = publicPath + "/"
    
    // Build number
    let build = parseInt(readFileSync("./build.txt", "UTF8")) + 1;
    writeFileSync("./build.txt", build.toString());

    /** @type {import('webpack').Configuration} */
    var config = {
        mode: devMode ? "development" : "production",
        target: "web",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: [
                        /node_modules/
                    ]
                },
                {
                    test: /\.module\.s[ac]ss$/,
                    use: [MiniCssExtractPlugin.loader, {
                        loader: "css-loader",
                        options: {
                            importLoaders: 2,
                            modules: {
                                localIdentHashDigestLength: 16,
                                localIdentName: devMode ? '[local]_[name]_[hash:base64:5]' : '[hash]',
                            },
                        }
                    }, "postcss-loader", "sass-loader"]
                },
                {
                    test: /\.s[ac]ss$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader", "sass-loader"],
                    exclude: /\.module\.s[ac]ss$/
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif|woff2|bmp)$/,
                    type: "asset/resource",
                    generator: fileNameGen("img")
                },
                {
                    test: /\.(wav)$/,
                    type: "asset/resource",
                    generator: fileNameGen("static")
                },
                {
                    test: /\.(json)$/,
                    type: "asset/source",
                    generator: fileNameGen("static")
                }
            ]
        },
        resolve: {
            extensions: [".tsx", ".ts", ".jsx", ".js", ".json", "css", ".scss", ".sass", ".svg", ".bmp", ".woff2", ".html"]
        },
        entry: {
            "index": path.join(__dirname, "./src/index.tsx")
        },
        output: {
            filename: "js/[contenthash].js",
            chunkFilename: "js/[contenthash].js",
            assetModuleFilename: "[contenthash][ext][query]",
            path: outputPath,
            publicPath: publicPathForStupidOne,
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.join(__dirname, "./src/index.html"),
                filename: "index.html",
                publicPath: publicPathForStupidOne,
                buildNumber: build
            }),
            new MiniCssExtractPlugin({
                filename: "css/[contenthash].css"
            }),
        ]
    }

    if (!devMode) {
        /** @type {import('webpack').Configuration} */
        config = {
            ...config,
            optimization: {
                minimize: !devMode,
                minimizer: [
                    new CssMinimizerPlugin(),
                    new HtmlMinimizerPlugin(),
                    new TerserPlugin({
                        extractComments: false,
                        terserOptions: {
                            compress: {
                                ecma: 2020,
                                // drop_console: true,

                            },
                            format: {
                                comments: false
                            },
                            mangle: true
                        }
                    })
                ]
            }
        }
    }

    if (env.WEBPACK_SERVE && !env.buildonly) {
        /** @type {import('webpack').Configuration} */
        config = {
            ...config,
            devtool: 'inline-source-map',
            devServer: {
                static: "./dist",
                historyApiFallback: true,
                hot: false,
                liveReload: false,
                allowedHosts: ["localhost"]
            }
        }
    }

    return config;
}