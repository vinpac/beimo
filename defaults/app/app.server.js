import Beimo from '../../lib/Beimo'
import Document from '../Document'
import assets from './assets.json' // eslint-disable-line import/no-unresolved
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<beimo:pages-path>'
import routes from '<beimo:routes-path>'
import configureApp from '<beimo:configureApp-path>'
/* eslint-enable */

const app = new Beimo({
  pages,
  routes,
  documentComponent: Document,
  scripts: [
    assets.vendor.js,
    assets.client.js,
  ],
})

if (configureApp) {
  configureApp(app)
}

app.prepare = (server, handle) => {
  if (!module.hot) {
    handle(server)
  } else {
    server.hot = module.hot
    module.hot.accept('<beimo:pages-path>', () => {
      // eslint-disable-next-line
      app.configure({ pages: require('<beimo:pages-path>').default })
    })

    if (process.env.HAS.ROUTES) {
      module.hot.accept('<beimo:routes-path>', () => {
        // eslint-disable-next-line
        app.configure({ routes: require('<beimo:routes-path>').default })
      })
    }

    if (process.env.HAS.APP_CONFIGURATION) {
      module.hot.accept('<beimo:configureApp-path>', () => {
        // eslint-disable-next-line
        require('<beimo:configureApp-path>').default(app)
      })
    }
  }

  return server
}

export default app
