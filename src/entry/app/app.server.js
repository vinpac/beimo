import path from 'path'
import App from '../../modules/App'
import Document from '../pages/Document'
import { normalizePages } from '../../modules/utils'
import assets from './assets.json' // eslint-disable-line import/no-unresolved
/* eslint-disable import/no-unresolved,import/first,import/extensions */
// Replaced by parse-defaults
import configureApp from '<beimo:configureApp-path>'
import pages from '<beimo:pages-path>'
/* eslint-enable */

normalizePages(pages)

const app = new App(
  pages,
  assets,
  assets.client.css ? [{ url: assets.client.css }] : [],
  Document,
)

if (configureApp) {
  configureApp(app)
}

app.prepare = (server, m, run = m) => {
  if (!module.hot) {
    run(server)
  } else {
    server.hot = m.hot || module.hot

    /* eslint-disable no-underscore-dangle */
    server.__beimo_addDevForceServerReload__ = fn => {
      app.__beimo_devForceServerReload__ = fn
    }
    /* eslint-enable no-underscore-dangle */

    module.hot.accept('./assets.json', () => {
      // eslint-disable-next-line import/no-unresolved, no-underscore-dangle
      app.__setAssets(require('./assets.json'))
    })

    module.hot.accept('<beimo:pages-path>', () => {
      // eslint-disable-next-line import/no-unresolved, no-underscore-dangle
      app.configure({ pages: normalizePages(require('<beimo:pages-path>').default) })
    })

    if (process.env.HAS_APP_CONFIGURATION) {
      module.hot.accept('<beimo:configureApp-path>', () => {
        // eslint-disable-next-line
        require('<beimo:configureApp-path>').default(app)
      })
    }
  }

  return server
}

export default app
export const STATIC_PATH = path.resolve(__dirname, process.env.STATIC_PATH) // eslint-disable-line
