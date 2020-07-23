module.exports = {
    title: "sammyne",
    description: 'Just playing around :)',
    // dest: 'public',
    head: [
        ['link', { rel: 'icon', href: '/favicon.ico' }],
        ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }]
    ],
    // the effect is on only when the date field is set in frontmatter
    permalink: '/:year/:month/:day/:slug',
    plugins: {
        "@vuepress-reco/vuepress-plugin-pagation": {
            perPage: 8, // @TODO: figure why this doesn't override the default
        },
    },
    theme: 'reco',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/', icon: 'reco-home' },
            { text: 'TimeLine', link: '/timeline/', icon: 'reco-date' },
            { text: 'Github', link: 'https://github.com/sammyne', icon: 'reco-github' },
            //{
            //    text: 'Contact',
            //    icon: 'reco-message',
            //    items: [
            //        { text: 'GitHub', link: 'https://github.com/recoluan', icon: 'reco-github' }
            //    ]
            //}
        ],
        sidebar: "auto",
        type: 'blog',
        // 博客设置
        blogConfig: {
            category: {
                location: 2, // 在导航栏菜单中所占的位置，默认2
                text: 'Category' // 默认 “分类”
            },
            tag: {
                location: 3, // 在导航栏菜单中所占的位置，默认3
                text: 'Tag' // 默认 “标签”
            }
        },
        friendLink: [
            {
                title: 'vuepress-theme-reco',
                desc: 'A simple and beautiful vuepress Blog & Doc theme.',
                avatar: "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
                link: 'https://vuepress-theme-reco.recoluan.com'
            },
        ],
        logo: '/logo.svg',
        // 搜索设置
        search: true,
        searchMaxSuggestions: 10,
        // 自动形成侧边导航
        sidebar: 'auto',
        // 最后更新时间
        lastUpdated: 'Last Updated',
        // 作者
        author: 'sammyne',
        // 作者头像
        authorAvatar: '/avatar.png',
        // 备案号
        record: 'xxxx',
        // 项目开始时间
        startYear: '2020'
        /**
         * 密钥 (if your blog is private)
         */

        // keyPage: {
        //   keys: ['your password'],
        //   color: '#42b983',
        //   lineColor: '#42b983'
        // },

        /**
         * valine 设置 (if you need valine comment )
         */

        // valineConfig: {
        //   appId: '...',// your appId
        //   appKey: '...', // your appKey
        // }
    },
    markdown: {
        lineNumbers: true
    }
}