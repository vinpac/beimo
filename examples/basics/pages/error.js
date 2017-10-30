import React from 'react'
import PropTypes from 'prop-types'

const ErrorPage = ({ error }) => (
  __DEV__ ?
    <div>
      <h1>{error.message}</h1>
      <pre>{error.stack}</pre>
    </div>
  :
    <div>
      <h1>Internal server error</h1>
    </div>

)

ErrorPage.displayName = 'ErrorPage'

export default ErrorPage
