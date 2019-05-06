import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'

import highlightLine from './highlightLine'

loadLanguages(['go'])

const highlight = (text, lang) => {
  text = text.endsWith('\n') ? text.slice(0, -1) : text

  const l = Prism.languages[lang] || 'markup'

  const lines = Prism.highlight(text, Prism.languages[l]).split('\n')
  const code = lines.map(highlightLine).join('')

  if (l && Prism.languages[l]) {
    try {
      return (
        `<pre class="language-${lang}"><code class="language-${lang}">` +
        code +
        '</pre></code>'
      )
    } catch (__) {}
  }

  return ''
}

export default highlight
