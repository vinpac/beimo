import React from 'react'
import PropTypes from 'prop-types'

const ErrorPage = ({ error }) => (
  <div className="container viewSpacer">
    <h1>{error.name || error.detail || 'Error'}</h1>
    <h3 className="text--muted-dark font--weight-normal">{error.message}</h3>
    {error.stack && <pre className="fancyScrollbar">{error.stack}</pre>}
  </div>
)

ErrorPage.displayName = 'ErrorPage'

export default ErrorPage
