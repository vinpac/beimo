import React from 'react'
import Link from 'beimo/link'

const NotFound = () => (
  <div>
    <h1>Not found</h1>
    <Link to="/">Home</Link>
    <Link to="/about">About</Link>
  </div>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ response }) => {
  response.status = 404
}

export default NotFound
