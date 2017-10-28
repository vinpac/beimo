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

export default instance
