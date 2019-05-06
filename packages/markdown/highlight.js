import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'

import highlightLine from './highlightLine'
import parseLanguage from './parseLanguage'

loadLanguages(['go'])

const highlight = (text, lang) => {
  text = text.endsWith('\n') ? text.slice(0, -1) : text

  //console.log('***' + lang)
  let { language } = parseLanguage(lang)
  console.log('----' + language)
  if (!language || !Prism.languages[language]) {
    language = 'markup' // fallback to markup
  }

  const grammar = Prism.languages[language]

  //const lines = Prism.highlight(text, Prism.languages[l]).split('\n')
  try {
    const lines = Prism.highlight(text, grammar).split('\n')
    const code = lines.map(highlightLine).join('')

    return (
      `<pre class="language-${language}"><code class="language-${language}">` +
      code +
      '</pre></code>'
    )
  } catch (__) {}

  return ''
}

export default highlight
