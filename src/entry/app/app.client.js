import App from '../../modules/App'
import { parsePages } from '../../modules/Router'
/* eslint-disable */
// Replaced by parse-defaults
import configureApp from '<beimo:configureApp-path>'
import pages from '<beimo:pages-path>'
/* eslint-enable */

const errorPage = {
  use: 'error',
  load: () => import(/* webpackChunkName: 'pages/_error' */'../_error'),
}

if (!pages.some(page => page.use !== 'error')) {
  pages.push(errorPage)
}

const app = new App(parsePages(pages))

if (configureApp) {
  configureApp(app)
}

if (module.hot) {
  module.hot.accept('<beimo:pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    app.configure(parsePages(require('<beimo:pages-path>').default))
    app.hydrate(document.getElementById('root'), true)
  })
}

export default app
