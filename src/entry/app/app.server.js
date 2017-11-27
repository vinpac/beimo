import App from '../../modules/App'
import Document from '../_document'
import assets from './assets.json' // eslint-disable-line import/no-unresolved
import ErrorPage from '../_error'
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<beimo:pages-path>'
import configureApp from '<beimo:configureApp-path>'
import { createErrorPageResolver } from '../../modules/Router'
/* eslint-enable */


const app = new App({
  pages,
  documentComponent: Document,
  assets,
  styles: assets.client.css ? [{ url: assets.client.css }] : [],
  resolveErrorPage: createErrorPageResolver(
    pages.find(p => p.miss),
    () => ErrorPage,
  ),
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
      // eslint-disable-next-line import/no-unresolved
      app.configure({ pages: require('<beimo:pages-path>').default })
    })

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
