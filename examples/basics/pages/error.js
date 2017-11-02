import React from 'react'
import PropTypes from 'prop-types'

const ErrorPage = ({ error }) => (
  __DEV__ ? (
    <div className="page">
      <h1 className="title">{error.message}</h1>
      <pre className="text-left">{error.stack}</pre>
    </div>
  ) : (
    <div className="page">
      <h1 className="title">Internal server error</h1>
    </div>
  )
)

ErrorPage.displayName = 'ErrorPage'
ErrorPage.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
    stack: PropTypes.string,
  }).isRequired,
}

export default ErrorPage
