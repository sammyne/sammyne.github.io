const hightlightLine = (line, index, highlighted) => {
  const lineClass = highlighted ? 'highlighted-line' : ''

  return `<div class="${lineClass}"><span class="line-idx">${index}</span> ${line}</div>`
}

export default hightlightLine
