import fs from 'fs'
import path from 'path'
import { readFile, writeFile, makeDir, copyFile } from './fs'

const filesToParse = [
  'client.js',
  'server.js',
  'instance/instance.server.js',
  'instance/instance.client.js',
]

const filesTocopy = [
  'Document.js',
  'instance/package.json',
]

const nodes = [
  {
    key: 'pages',
    path: 'pages/index.js',
  },
  {
    key: 'routes',
    serverOnly: true,
    ifExists: true,
    path: 'routes/index.js',
  },
  {
    key: 'configureApp',
    ifExists: true,
    path: 'beimo.app.js',
  },
].map(node => ({
  ...node,
  reImport: new RegExp(`import\\s+${node.key}\\s+from\\s+(?:'<${node.key}>'|"<${node.key}>")`, 'g'),
  rePath: new RegExp(`(?:'<${node.key}-path>'|"<${node.key}-path>")`, 'g'),
}))

export default async function parseDefaults({ sourcePath }) {
  const testNodes = nodes.map(node => ({
    ...node,
    condition: node.ifExists ? fs.existsSync(path.join(sourcePath, node.path)) : true,
  }))

  await makeDir(path.join(__dirname, '..', '.beimo', 'instance'))

  filesToParse.forEach(async filename => {
    let body = await readFile(path.resolve(__dirname, '..', 'defaults', filename))

    testNodes.forEach(node => {
      const relPath = path.relative(
        path.resolve(__dirname, '../defaults', filename, '..'),
        path.join(sourcePath, node.path),
      )

      // Replace imports
      body = body.replace(
        node.reImport,
        () => {
          if (node.serverOnly && /client\.js$/.test(filename)) {
            throw new Error(`${node.key} are server-only`)
          }

          return node.condition
            ? `import ${node.key} from '${relPath}'`
            : `const ${node.key} = undefined`
        },
      )

      // Replace paths
      body = body.replace(
        node.rePath,
        () => {
          if (node.serverOnly && /client\.js$/.test(filename)) {
            throw new Error(`${node.key} are server-only`)
          }

          return `'${relPath}'`
        },
      )
    })

    await writeFile(path.join(__dirname, '../.beimo', filename), body)
  })

  // Copy files
  filesTocopy.forEach(filepath => copyFile(
    path.join(__dirname, '../defaults', filepath),
    path.join(__dirname, '../.beimo', filepath),
  ))
}
