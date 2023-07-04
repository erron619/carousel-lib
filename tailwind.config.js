module.exports = {
    mode: "jit",
    content: [
        "./pages/**/*.ejs", 
        "./components/**/*.ejs", 
        "./scripts/components/**/*.js"
    ],
    darkMode: "class",
    safelist: [],
    theme: {
        // dropShadow: {},
        // colors: {
            // transparent: "transparent",
            // inherite   : "inherite",
        // },
        // fontFamily: {},
        // fontWeight: {},
        // screens: {
        //     sm: "640px",
        //     md: "768px",
        //     lg: "1024px",
        //     xl: "1280px",
        // },
        extend: {
            container: {
                center: true,
                padding: "1rem"
            },
        }
    },
    plugins: [],
};