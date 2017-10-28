import React from 'react'
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
  const deepForceUpdate = require('react-deep-force-update')
  module.hot.accept('<pages-path>', () => {
    // eslint-disable-next-line import/no-unresolved
    instance.configure({ pages: require('<pages-path>').default })
    deepForceUpdate(React)(instance.appInstance)
  })
}

export default instance
