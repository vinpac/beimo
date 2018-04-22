const yaml = require('js-yaml')
const loaderUtils = require('loader-utils')
const createRouterMap = require('../create-router-map').default

module.exports = function pagesMapLoader(content) {
  if (this.cacheable) {
    this.cacheable()
  }

  const { isClient } = loaderUtils.getOptions(this)
  const routerMap = createRouterMap(yaml.safeLoad(content))

  try {
    return `
      module.exports = {
        routes: [
          ${routerMap.routes
            .map(
              route => `{
          id: "${route.id}",
          page: "${route.page}",
          matcher: {
            re: ${String(route.matcher.re)},
            keys: ${JSON.stringify(route.matcher.keys)},
          },
          props: ${JSON.stringify(route.matcher.props)}
        }`,
            )
            .join(',\n')}
        ],
        pages: ${JSON.stringify(routerMap.pages)},
      }

      ${isClient &&
        `
        ;(function (map) {
          if(!map) return
          if (!module.hot) return
          module.hot.accept()
          if (module.hot.status() === 'idle') return
          __BEIMO_HOT_UPDATE_PAGES(map)
        })(typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__.default : (module.exports.default || module.exports))
      `}
    `
  } catch (err) {
    this.emitError(err)
    return null
  }
}
