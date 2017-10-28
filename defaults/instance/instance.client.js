import App from '../../lib/App'
/* eslint-disable */
// Replaced by parse-defaults
import pages from '<pages>'
import configureApp from '<configureApp>'
/* eslint-enable */

const instance = new App({ pages })

if (configureApp) {
  configureApp(instance)
}

if (module.hot) {
  module.hot.accept('<pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    instance.configure({ pages: require('<pages-path>').default })
    instance.hydrate(document.getElementById('root'))
  })
}

export default instance
