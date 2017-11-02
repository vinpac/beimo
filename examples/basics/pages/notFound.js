import React from 'react'

const NotFound = () => (
  <div className="page">
    <h1 className="title">Page not found</h1>
  </div>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ error, response }) => {
  response.status = 404

  return { a: 3, error }
}

export default NotFound
