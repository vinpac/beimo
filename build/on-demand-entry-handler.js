import path from 'path'
import DynamicEntryPlugin from 'webpack/lib/DynamicEntryPlugin'
import getRequireablePath from './utils/get-requireable-path'
import { PageNotFoundError } from '../modules/router'

function createAllCompilersCallback(fn, compilers, remove) {
  const calledCompilers = []
  return compilerName => {
    if (calledCompilers.includes(compilerName)) {
      return
    }

    calledCompilers.push(compilerName)

    if (!compilers.some(compiler => !calledCompilers.includes(compiler.name))) {
      remove()
      fn()
    }
  }
}

class OnDemandEntryHandler {
  constructor(multiCompiler, pagesDir, buildedPages = [], watchers) {
    this.entries = {}
    this.watchers = watchers
    this.pagesDir = pagesDir
    this.compilers = multiCompiler.compilers

    buildedPages.forEach(page => {
      this.entries[page] = {}
    })

    this.compilers.forEach(compiler => {
      // compiler.hooks.make.tapAsync('OnDemandEntryHandlerMake', (compilation, done) => {
      compiler.plugin('make', (compilation, done) => {
        const allEntries = Object.keys(this.entries).map(
          name =>
            new Promise((resolve, reject) => {
              const depName = `pages/${name}`
              const dep = DynamicEntryPlugin.createDependency(this.entries[name].filepath, depName)

              compilation.addEntry(compiler.context, dep, depName, err => {
                if (err) {
                  reject(err)
                  return
                }

                resolve()
              })
            }),
        )

        return Promise.all(allEntries)
          .then(() => {
            done()
          })
          .catch(done)
      })

      // compiler.hooks.done.tap('OnDemandEntryHandlerDone', stats => {
      compiler.plugin('done', stats => {
        const { compilation } = stats

        Object.keys(this.entries).forEach(name => {
          if (this.entries[name].onDone) {
            this.entries[name].onDone.forEach(fn => fn(compilation.compiler.name))
          }
        })
      })
    })
  }

  on(page, fn) {
    if (this.entries[page]) {
      if (!this.entries[page].onDone) {
        this.entries[page].onDone = []
      }

      const index = this.entries[page].length
      this.entries[page].onDone.push(
        createAllCompilersCallback(fn, this.compilers, () => {
          this.entries[page].onDone.splice(index, 1)
        }),
      )
    }
  }

  async ensurePage(page) {
    if (this.entries[page]) {
      return null
    }

    // Ignore these pages since they are built on start
    if (page === '_error' || page === '_app') {
      return null
    }

    const filepath = getRequireablePath(path.join(this.pagesDir, page))

    if (filepath) {
      this.entries[page] = { filepath }
    } else {
      throw new PageNotFoundError(`Page '${path.join(this.pagesDir, page)}.js' not found`)
    }

    console.info(`> Building page: ${page}`)

    this.watchers.forEach(watcher => watcher.invalidate())
    return new Promise(resolve => {
      this.on(page, () => {
        resolve()
      })
    })
  }
}

export default OnDemandEntryHandler
