const yaml = require('js-yaml')
const loaderUtils = require('loader-utils')
const parseRoutesMap = require('../parse-routes-map').default


module.exports = function pagesMapLoader(content) {
  if (this.cacheable) {
    this.cacheable()
  }

  const { isClient } = loaderUtils.getOptions(this)

  try {
    return `
      var pages = [];
      var routes = ${JSON.stringify(parseRoutesMap(yaml.safeLoad(content), '', '', true))}.map(
        function(route) {
          if (!pages.includes(route.page)) {
            pages.push(route.page)
          }

          const lastSlashIndex = route.matcher.re.lastIndexOf('/');
          route.matcher.re = new RegExp(
            route.matcher.re.substr(1, lastSlashIndex - 1),
            route.matcher.re.substr(lastSlashIndex + 1)
          );
          return route;
        }
      );

      module.exports = { pages: pages, routes: routes };

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
