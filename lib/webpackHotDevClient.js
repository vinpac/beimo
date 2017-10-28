import hotClient from 'webpack-hot-middleware/client'
import launchEditorEndpoint from 'react-dev-utils/launchEditorEndpoint'
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages'
import {
  reportBuildError,
  dismissBuildError,
  startReportingRuntimeErrors,
  stopReportingRuntimeErrors,
} from 'react-error-overlay'

hotClient.useCustomOverlay({
  showProblems(type, errors) {
    const formatted = formatWebpackMessages({
      errors,
      warnings: [],
    })

    reportBuildError(formatted.errors[0])
  },
  clear() {
    dismissBuildError()
  },
})

hotClient.setOptionsAndConnect({
  name: 'client',
  reload: true,
})

startReportingRuntimeErrors({
  launchEditorEndpoint,
  filename: '/assets/client.js',
})

if (module.hot) {
  module.hot.dispose(stopReportingRuntimeErrors)
}
