const parseLanguage = (lang) => {
  lang = lang.replace(/\s+/g, '')

  let language = lang.match(/^\w+/)
  if (!language) {
    return { language: lang }
  }
  language = language[0]

  const rangeStr = lang.slice(language.length).match(/^\{.+?\}/) || ['']

  const ranges = []
  rangeStr[0]
    .slice(1, -1)
    .split(',')
    .forEach((v) => {
      const nums = v.split('-', 3)

      const start = parseInt(nums[0])
      const end = parseInt(nums[1]) || start

      if (!isNaN(start) && !isNaN(end) && end >= start) {
        ranges.push({ start, end })
      }
    })

  return { language, ranges }
}

const parseLanguage2 = (lang) => {
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

export default parseLanguage2
//module.exports = parseLanguage
