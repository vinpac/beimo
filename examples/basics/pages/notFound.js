import React from 'react'

const NotFound = () => (
  <h1>Page not found</h1>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ error, response }) => {
  response.status = 404

  return { a: 3, error }
}

export default NotFound
