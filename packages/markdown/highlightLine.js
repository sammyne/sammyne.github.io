const hightlightLine = (line, index) => {
  const lineClass = 0 === index ? 'highlighted-line' : ''

  return `<div class="${lineClass}"><span class="line-idx">${index +
    1}</span> ${line}</div>`
}

export default hightlightLine
