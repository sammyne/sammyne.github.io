const fs = require('fs')
const path = require('path')

const contentsDir = path.resolve(__dirname, '../contents')
const manifest = 'todo.js'

const listContents = () => {
  const items = fs
    .readdirSync(contentsDir, { withFileTypes: true })
    .filter(item => item.isFile() && item.name.endsWith('.md'))
    // .map(item => `'${item.name.slice(0, -3)}'`) // 3 is the length of '.md
    .map((item) => {
      const { mtimeMs } = fs.statSync(path.resolve(contentsDir, item.name))
      return { name: item.name.slice(0, -3), mtimeMs }
    })

  // console.log(JSON.stringify(items, null, 2))

  const content = `export default ${JSON.stringify(items, null, 2)}\n`
  // console.log(content)

  const err = fs.writeFileSync(path.join(contentsDir, manifest), content)

  console.log(`done listing contents: ${err || 'ok'}`)
}

listContents()
