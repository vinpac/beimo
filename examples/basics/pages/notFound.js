import React from 'react'
import Head from 'beimo/head'

const NotFound = () => (
  <div className="page">
    <Head>
      <title>Page not found</title>
    </Head>
    <h1 className="title">Page not found</h1>
  </div>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ error, response }) => {
  response.status = 404

  return { a: 3, error }
}

export default NotFound
