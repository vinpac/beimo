import path from 'path'
import { readDir, readFile } from '../lib/fs'

function parsePageToExport(filepath, pagePath) {
  // Remove .js extension
  const chunkName = `bundles/${pagePath.substr(0, pagePath.length - 3)}`
  return readFile(filepath)
    .then(body => {
      return `
        { path: '/', load: () => import(/* webpackChunkName: '${chunkName}' */'./${pagePath}')},
      `
    })
}

export default async params => {
  const sharedEntries = {}
  const pagesMap = {}
  await readDir('**/*.js', { cwd: path.join(params.sourcePath, 'pages') })
    // Filter files to pages/*.js or pages/**/*/index.js
    .then(files => files.filter(p => (p.includes('/') ? /\/index\.js$/.test(p) : true)))
    .then(pages => {
      const promises = []
      pages.forEach(pagePath => {
        promises.push(
          parsePageToExport(path.join(params.sourcePath, pagePath), pagePath)
            .then(pageExport => {
              pagesMap[pagePath] = pageExport
            }),
        )
      })

      return Promise.all(promises)
    })




  let fileBody = ''

}
