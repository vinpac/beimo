import Beimo from '../../lib/Beimo'
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<beimo:pages-path>'
import configureApp from '<beimo:configureApp-path>'
/* eslint-enable */

const app = new Beimo({ pages })

if (configureApp) {
  configureApp(app)
}

if (module.hot) {
  module.hot.accept('<beimo:pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    app.configure({ pages: require('<beimo:pages-path>').default })
    app.hydrate(document.getElementById('root'))
  })
}

export default app
