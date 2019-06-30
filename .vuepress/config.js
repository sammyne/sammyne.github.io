module.exports = {
    description: "Just playing around",
    markdown: {
        lineNumbers: true
    },
    permalink: '/:year/:month/:day/:slug',
    title: "sammy",
    theme: "@sammyne/vuepress-theme-sammyne",
    themeConfig: {
        nav: [
            {
                text: "主页",
                link: "/",
            },
            {
                text: "TODO",
                link: "/todo",
            },
        ],
        sidebar: 'auto'
    },
}