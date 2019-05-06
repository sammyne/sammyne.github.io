import highlightLine from './highlightLine'

const Prism = require('prismjs')
const loadLanguages = require('prismjs/components/')

loadLanguages(['go'])

const md = require('markdown-it')({
  highlight(str, lang) {
    str = str.endsWith('\n') ? str.slice(0, -1) : str

    const lines = Prism.highlight(str, Prism.languages[lang], lang).split('\n')
    const code = lines.map(highlightLine).join('')

    if (lang && Prism.languages[lang]) {
      try {
        return (
          `<pre class="language-${lang}"><code class="language-${lang}">` +
          code +
          '</pre></code>'
        )
      } catch (__) {}
    }

    return ''
  },
  linkify: true
})
  .use(require('markdown-it-anchor'), {
    permalink: true,
    // permalinkBefore: true
    permalinkClass: 'header-anchor primary--text'
  })
  .use(require('markdown-it-toc-done-right'), { listType: 'ul' })
//const highlightLine = require('./highlightLine')

module.exports = md
