import hotClient from 'webpack-hot-middleware/client'
import launchEditorEndpoint from 'react-dev-utils/launchEditorEndpoint'
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages'
import {
  setEditorHandler,
  reportBuildError,
  startReportingRuntimeErrors,
  stopReportingRuntimeErrors,
} from 'react-error-overlay'

setEditorHandler(errorLocation => {
  const fileName = encodeURIComponent(errorLocation.fileName)
  const lineNumber = encodeURIComponent(errorLocation.lineNumber || 1)
  const colNumber = encodeURIComponent(errorLocation.colNumber || 1)

  fetch(
    // Keep in sync with react-dev-utils/errorOverlayMiddleware
    `${launchEditorEndpoint}?fileName=${fileName}&lineNumber=${lineNumber}&colNumber=${colNumber}`,
  )
})

hotClient.useCustomOverlay({
  showProblems(type, errors) {
    const formatted = formatWebpackMessages({
      errors,
      warnings: [],
    })

    reportBuildError(formatted.errors[0])
  },
  clear() {
    if (window.HMR_HAS_ERROR) {
      window.location.reload()
    }
  },
})

hotClient.setOptionsAndConnect({
  name: 'client',
  path: 'http://localhost:3001/__webpack_hmr',
  reload: true,
})

startReportingRuntimeErrors({
  onError() {
    window.HMR_HAS_ERROR = true
  },
  filename: `/_beimo_/${process.env.BUILD_ID}/client.js`,
})

if (module.hot) {
  module.hot.dispose(stopReportingRuntimeErrors)
}
