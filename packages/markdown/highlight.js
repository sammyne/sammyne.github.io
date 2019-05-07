import parseLanguage from './parseLanguage'

const wrap = (code, lang, highlightedLine) => {
  return (
    `<pre data-line="${highlightedLine}" class="language-${lang} line-numbers">` +
    `<code class="language-${lang}">${code}</code>` +
    `</pre>`
  )
}

const highlight = (text, lang) => {
  text = text.endsWith('\n') ? text.slice(0, -1) : text

  const { language, ranges } = parseLanguage(lang)

  return wrap(text, language || 'markup', ranges)
}

export default highlight
