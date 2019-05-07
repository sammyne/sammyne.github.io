const parseLanguage = (lang) => {
  lang = lang.replace(/\s+/g, '')

  let language = lang.match(/^\w+/)
  if (!language) {
    return { language: lang }
  }
  language = language[0]

  const rangeStr = lang.slice(language.length).match(/^\{.+?\}/)
  const ranges = rangeStr ? rangeStr[0].slice(1, -1) : ''

  return { language, ranges }
}

export default parseLanguage
