import App from '../../modules/App'
import { normalizePages } from '../../modules/utils'
/* eslint-disable */
// Replaced by parse-defaults
import configureApp from '<beimo:configureApp-path>'
import pages from '<beimo:pages-path>'
/* eslint-enable */

normalizePages(pages)

const app = new App(pages)

if (configureApp) {
  configureApp(app)
}

if (module.hot) {
  module.hot.accept('<beimo:pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    app.configure({ pages: normalizePages(require('<beimo:pages-path>').default) })
  })
}

export default app
