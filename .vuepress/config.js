module.exports = {
    description: "Just playing around",
    markdown: {
        lineNumbers: true
    },
    // the effect is on only when the date field is set in frontmatter
    permalink: '/:year/:month/:day/:slug',
    title: "sammy",
    theme: "@sammyne/vuepress-theme-sammyne",
    themeConfig: {
        // should have no .git suffix
        docsRepo: "https://github.com/sammyne/sammyne.github.io",
        editLinks: true,
        lastUpdated: true, // string | boolean
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
        sidebar: 'auto',
    },
}