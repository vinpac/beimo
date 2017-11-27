import { ConcatSource } from 'webpack-sources'

const IS_BUNDLED_PAGE = /^pages.*$/
const MATCH_ROUTE_NAME = /^pages[/\\](.*)$/

class PageChunkTemplatePlugin {
  // eslint-disable-next-line
  apply (chunkTemplate) {
    chunkTemplate.plugin('render', (modules, chunk) => {
      if (!IS_BUNDLED_PAGE.test(chunk.name)) {
        return modules
      }

      let routeName = MATCH_ROUTE_NAME.exec(chunk.name)[1]

      // We need to convert \ into / when we are in windows
      // to get the proper route name
      // Here we need to do windows check because it's possible
      // to have "\" in the filename in unix.
      // Anyway if someone did that, he'll be having issues here.
      // But that's something we cannot avoid.
      if (/^win/.test(process.platform)) {
        routeName = routeName.replace(/\\/g, '/')
      }

      const source = new ConcatSource()

      source.add(`
        window.__BEIMO_PAGES__ = window.__BEIMO_PAGES__ || {}
        window.__BEIMO_PAGES__['${routeName}'] = function() {
          var comp =
      `)
      source.add(modules)
      source.add(`
          return { page: comp.default }
        }
      `)

      return source
    })
  }
}

export default class PagesPlugin {
  // eslint-disable-next-line
  apply (compiler) {
    compiler.plugin('compilation', compilation => {
      compilation.chunkTemplate.apply(new PageChunkTemplatePlugin())
    })
  }
}
