const fs = require('fs')
const path = require('path')

const contentsDir = path.resolve('../contents')

const listContents = () => {
  const items = fs
    .readdirSync(contentsDir, { withFileTypes: true })
    .filter(item => item.isFile() && item.name.endsWith('.md'))
    .map(item => `"${item.name.slice(0, -3)}"`) // 3 is the length of '.md

  // console.log(items)

  const err = fs.writeFileSync(
    `${contentsDir}/hello.js`,
    `export default [${items}]`
  )

  console.log(`done listing contents: ${err || 'ok'}`)
}

listContents()
