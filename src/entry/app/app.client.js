import App from '../../modules/App'
import ErrorPage from '../_error'
import { createErrorPageResolver } from '../../modules/Router'
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<beimo:pages-path>'
import configureApp from '<beimo:configureApp-path>'
/* eslint-enable */

const app = new App({
  pages,
  resolveErrorPage: createErrorPageResolver(
    pages.find(p => p.miss),
    () => ErrorPage,
  ),
})

if (configureApp) {
  configureApp(app)
}

if (module.hot) {
  module.hot.accept('<beimo:pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    const newPages = require('<beimo:pages-path>').default
    app.configure({
      pages: newPages,
      resolveErrorPage: createErrorPageResolver(
        newPages.find(p => p.miss),
        () => ErrorPage,
      ),
    })
    app.hydrate(document.getElementById('root'))
  })
}

export default app
