import highlight from './highlight'

const md = require('markdown-it')({
  highlight,
  linkify: true
})
  .use(require('markdown-it-anchor'), {
    permalink: true
    // permalinkBefore: true
  })
  .use(require('markdown-it-toc-done-right'), { listType: 'ul' })

module.exports = md
