const path = require('path')
const loaderUtils = require('loader-utils')

const defaultPagesDir = path.resolve(__dirname, '..', '..', 'defaults', 'pages')
function getPage(resourcePath, pagesDir) {
  const dir = [pagesDir, defaultPagesDir].find(d => resourcePath.indexOf(d) === 0)
  const routePath = path.relative(dir, resourcePath)
  return routePath.replace(/((^|\/)index)?\.js$/, '')
}

module.exports = function hotSelfAcceptLoader(content, sourceMap) {
  this.cacheable()

  const options = loaderUtils.getOptions(this)
  const page = getPage(this.resourcePath, options.pagesDir)

  // Webpack has a built in system to prevent default from colliding, giving it a random
  // letter per export.
  // We can safely check if Component is undefined since all other pages imported into the
  // entrypoint don't have __webpack_exports__.default
  this.callback(
    null,
    `${content}
    ;(function (Component, page) {
      if(!Component) return
      if (!module.hot) return
      module.hot.accept()
      if (module.hot.status() === 'idle') return
      __BEIMO_HOT_UPDATE(page, Component)
    })(typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__.default : (module.exports.default || module.exports), ${
  JSON.stringify(page)})
  `,
    sourceMap,
  )
}
