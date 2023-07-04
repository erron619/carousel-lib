const data                                    = require("./scripts/data");
const Glob                                    = require("glob");
const webpack                                 = require("webpack");
const MiniCssExtractPlugin                    = require("mini-css-extract-plugin");
const CssMinimizerPlugin                      = require("css-minimizer-webpack-plugin");
const HTMLWbpackPlugin                        = require("html-webpack-plugin");
const BrowserSyncPlugin                       = require("browser-sync-webpack-plugin");
const { join }                                = require("path");
const { htmlWebpackPluginTemplateCustomizer } = require("template-ejs-loader");

module.exports = async (env, argv) => {
    const mode = argv.mode;
    const isDev = mode === "development" ? true : false;
    console.log("mode: " + mode + " => isDev: " + isDev);
    return {
        stats: isDev ? "errors-warnings" : "normal",
        entry: "./scripts/main.js",
        output: {
            filename: "./scripts/main.js",
            path: join(__dirname, "build"),
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    exclude: /node_modules/,
                    use: "babel-loader",
                },
                {
                    test: /\.(png|jpg|jpge|svg)$/,
                    type: "asset/resource",
                    generator: { filename: "assets/images/[name][ext]" },
                },
                {
                    test: /\.(ttf|woff|woff2|eot)$/,
                    type: "asset/resource",
                    generator: { filename: "assets/fonts/[name][ext]" },
                },
                {
                    test: /\.(s[ac]ss|css)$/,
                    use: [
                        isDev ? "style-loader" : MiniCssExtractPlugin.loader,
                        "css-loader",
                        "postcss-loader",
                        "sass-loader",
                    ],
                },
                {
                    test: /\.ejs$/,
                    use: [
                        {
                            loader: "html-loader",
                            options: { minimize: false },
                        },
                        "template-ejs-loader",
                    ],
                },
            ],
        },
        optimization: {
            minimizer: [new CssMinimizerPlugin()],
        },
        plugins: [
            new BrowserSyncPlugin({
                port: 3000,
                host: "localhost",
                startPath: "pages",
                server: { baseDir: ["build"] },
            }),
            ...(await Glob.sync("pages/**/*.ejs").map((path) => {
                return new HTMLWbpackPlugin({
                    template: htmlWebpackPluginTemplateCustomizer({
                        templatePath: path,
                        templateEjsLoaderOption: {
                            root:"",
                            data
                        }
                    }),
                    minify: false,
                    filename: path.replace("ejs", "html"),
                });
            })),
            new MiniCssExtractPlugin({
                filename: "./styles/[name].css",
            }),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery",
                "window.jQuery": "jquery",
            }),
        ],
    };
};
