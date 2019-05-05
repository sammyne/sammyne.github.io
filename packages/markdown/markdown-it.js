const Prism = require('prismjs')
const loadLanguages = require('prismjs/components/')
loadLanguages(['go'])

const md = require('markdown-it')({
  highlight(str, lang) {
    //const hello = Prism.highlight(str, Prism.languages[lang], lang)
    const lines = Prism.highlight(str, Prism.languages[lang], lang).split('\n')
    const code = lines
      .map((v, i) => `<div><span class="line-idx">${i}</span> ${v}</div>`)
      .join('')

    if (lang && Prism.languages[lang]) {
      try {
        return (
          `<pre class="language-${lang}"><code class="language-${lang}">` +
          //Prism.highlight(str, Prism.languages[lang], lang) +
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
//  .use(require('./highlightLines'))

module.exports = md
