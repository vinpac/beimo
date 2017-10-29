import React from 'react'
import Link from 'beimo/link'

const NotFound = () => (
  <div>
    <h1>Not found</h1>
    <Link to="/home">Home 87 65465</Link>
    <Link to="/about">About 2</Link>
  </div>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ context }) => {
  context.status = 404
}

export default NotFound
