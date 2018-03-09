import path from 'path'
import getRequireablePath from './utils/get-requireable-path'

const specialPages = ['_app', '_document', '_error']

export default function createPageEntries({ sourceDir }, pages) {
  const clientEntries = {}
  const serverEntries = {}

  const addServerEntry = (page, filepath) => { serverEntries[`pages/${page}`] = filepath }
  const addClientEntry = (page, filepath) => { clientEntries[`pages/${page}`] = filepath }

  pages.forEach(page => {
    const filepath = getRequireablePath(path.join(sourceDir, 'pages', page))

    if (!filepath) {
      throw new Error(`Page '${page}' not found`)
    }

    addServerEntry(page, filepath)
    addClientEntry(page, filepath)
  })

  specialPages.forEach(page => {
    const filepath = getRequireablePath(path.join(sourceDir, 'pages', page))

    if (filepath) {
      addServerEntry(page, filepath)

      if (page !== '_document') {
        addClientEntry(page, filepath)
      }

      return
    }

    // There's no default _app
    if (page === '_app') {
      return
    }

    const defaultPageFilepath = path.resolve(__dirname, '..', 'defaults', 'pages', `${page}.js`)
    addServerEntry(page, defaultPageFilepath)
    if (page !== '_document') {
      addClientEntry(page, defaultPageFilepath)
    }
  })


  return { clientEntries, serverEntries }
}
