module.exports = (env) => {
    let prod = env.mode === "production";
    return {
        plugins: [
            require("autoprefixer"),
            prod ? require("cssnano") : false
        ]
    }
}