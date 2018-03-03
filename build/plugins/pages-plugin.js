import { ConcatSource } from 'webpack-sources'

class PageChunkTemplatePlugin {
  constructor(RE_PAGE, pages) {
    this.RE_PAGE = RE_PAGE
    this.pages = pages
  }

  apply(chunkTemplate) {
    chunkTemplate.plugin('render', (modules, chunk) => {
      const match = this.RE_PAGE.exec(chunk.name)

      if (!match) {
        return modules
      }

      let [, page] = match

      if (this.pages.indexOf(page) === -1) {
        return modules
      }

      // We need to convert \ into / when we are in windows
      // to get the proper route name
      // Here we need to do windows check because it's possible
      // to have "\" in the filename in unix.
      // Anyway if someone did that, he'll be having issues here.
      // But that's something we cannot avoid.
      if (/^win/.test(process.platform)) {
        page = page.replace(/\\/g, '/')
      }

      page = page.replace(/(^|\/)index$/, '')

      const source = new ConcatSource()

      source.add(`
        __BEIMO_REGISTER_PAGE('${page}', function() {
          var comp =
      `)
      source.add(modules)
      source.add(`
          comp.default.__page = ${JSON.stringify(page)}
          return comp.default
        })
      `)

      return source
    })
  }
}

export default class PagesPlugin {
  constructor(pages, pagesWatcher) {
    const defaultPages = ['_app', '_error']
    this.RE_PAGE = /^pages[/\\](.*)$/
    this.pages = [...defaultPages, ...pages]

    if (pagesWatcher) {
      pagesWatcher.addOnChange((newRoutes, newPages) => {
        this.pages = [...defaultPages, ...newPages]
      })
    }
  }

  apply(compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.chunkTemplate.apply(new PageChunkTemplatePlugin(this.RE_PAGE, this.pages))
      // compilation.mainTemplate.hooks.render.tap('PagesPlugin', (modules, chunk) => {
      //   const match = this.RE_PAGE.exec(chunk.name)

      //   if (!match) {
      //     return modules
      //   }

      //   let [, page] = match

      //   if (this.pages.indexOf(page) === -1) {
      //     return modules
      //   }

      //   // We need to convert \ into / when we are in windows
      //   // to get the proper route name
      //   // Here we need to do windows check because it's possible
      //   // to have "\" in the filename in unix.
      //   // Anyway if someone did that, he'll be having issues here.
      //   // But that's something we cannot avoid.
      //   if (/^win/.test(process.platform)) {
      //     page = page.replace(/\\/g, '/')
      //   }

      //   page = page.replace(/(^|\/)index$/, '')

      //   const source = new ConcatSource()

      //   source.add(`
      //     __BEIMO_REGISTER_PAGE('${page}', function() {
      //       var comp =
      //   `)
      //   source.add(modules)
      //   source.add(`
      //       comp.default.__page = ${JSON.stringify(page)}
      //       return comp.default
      //     })
      //   `)

      //   return source
      // })
    })
  }
}
