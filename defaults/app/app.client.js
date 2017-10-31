import Beimo from '../../lib/Beimo'
import { parsePagesConfig } from '../../lib/utils'
/* eslint-disable */
// Replaced by parse-defaults
import configureApp from '<beimo:configureApp-path>'
import pagesConfig from '<beimo:pages-path>'
/* eslint-enable */

const app = new Beimo(parsePagesConfig(pagesConfig))

if (configureApp) {
  configureApp(app)
}

if (module.hot) {
  module.hot.accept('<beimo:pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    app.configure(parsePagesConfig(require('<beimo:pages-path>').default))
    app.hydrate(document.getElementById('root'))
  })
}

export default app
