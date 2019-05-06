import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'

import highlightLine from './highlightLine'
import parseLanguage from './parseLanguage'

loadLanguages(['go'])

const wrap = (code, lang) => {
  /*
  return `<div class="code-snippet">
      <div class="toolbar">
        <span>${lang}</span>
      </div>
      <pre class="language-${lang}"><code class="language-${lang}">${code}</code></pre>
    </div>`
    */
  const langLine = `<div class="toolbar"><span>${lang}<span></div>`
  //code = `${langLine}${code}`

  return (
    `<pre class="language-${lang}">` +
    `<code class="language-${lang}">${langLine}${code}</code>` +
    `</pre>`
  )
}

const highlight = (text, lang) => {
  text = text.endsWith('\n') ? text.slice(0, -1) : text

  //console.log('***' + lang)
  let { language, ranges } = parseLanguage(lang)
  if (!language || !Prism.languages[language]) {
    language = 'markup' // fallback to markup
  }

  const grammar = Prism.languages[language]

  ranges = ranges || []
  try {
    const lines = Prism.highlight(text, grammar).split('\n')
    const code = lines
      .map((line, idx) => {
        idx++ // converse from 0-based to 1-based
        const inRange = ranges.some(v => v.start <= idx && idx <= v.end)
        return highlightLine(line, idx, inRange)
      })
      .join('')

    return wrap(code, language)
  } catch (__) {}

  return ''
}

export default highlight
