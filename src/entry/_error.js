import React from 'react'
import PropTypes from 'prop-types'

const ErrorPage = ({ error }) => (
  __DEV__ ? (
    <div>
      <h1>{error.name}
        {error.message &&
          <span style={{ fontWeight: 'normal' }}>
            {' - '}
            {error.message}
          </span>
        }
      </h1>
      <pre>{error.stack}</pre>
    </div>
  ) : (
    <div>
      <h1>Internal server error</h1>
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
