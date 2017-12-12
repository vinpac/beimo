import App from '../../modules/App'
import Document from '../_document'
import assets from './assets.json' // eslint-disable-line import/no-unresolved
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<beimo:pages-path>'
import configureApp from '<beimo:configureApp-path>'
import { createErrorPageResolver, parsePages } from '../../modules/Router'
/* eslint-enable */

const errorPage = {
  use: 'error',
  load: () => import(/* webpackChunkName: 'pages/_error' */ '../_error'),
}

if (!pages.some(page => page.use !== 'error')) {
  pages.push(errorPage)
}

const app = new App({
  ...parsePages(pages),
  documentComponent: Document,
  assets,
  styles: assets.client.css ? [{ url: assets.client.css }] : [],
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
      app.configure(parsePages(require('<beimo:pages-path>').default))
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
