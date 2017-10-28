import App from '../../lib/App'
import Document from '../Document'
import assets from './assets.json' // eslint-disable-line import/no-unresolved
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<pages>'
import routes from '<routes>'
import configureApp from '<configureApp>'
/* eslint-enable */

const instance = new App({
  pages,
  routes,
  documentComponent: Document,
  scripts: [
    assets.vendor.js,
    assets.client.js,
  ],
})

if (configureApp) {
  configureApp(instance)
}

instance.prepare = (server, handle) => {
  if (!module.hot) {
    handle(server)
  } else {
    server.hot = module.hotx
    module.hot.accept('<pages-path>')

    if (process.env.HAS.ROUTES) {
      module.hot.accept('<routes-path>')
    }
  }

  return server
}

export default instance
