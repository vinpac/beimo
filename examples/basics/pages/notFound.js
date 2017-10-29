import React from 'react'

const NotFound = () => (
  <h1>Page not found</h1>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ context }) => {
  context.status = 404
}

export default NotFound