import React from 'react'
import Head from 'beimo/head'

const NotFound = ({ a, error }) => (
  <div className="page">
    <Head>
      <title>Page not found</title>
    </Head>
    <h1 className="title">Page not found</h1>
    <p>{a}</p>
    { error && <pre>{error.stack}</pre> }
  </div>
)

NotFound.displayName = 'NotFound'
NotFound.getInitialProps = ({ response }) => {
  response.status = 404

  return { a: 3 }
}

export default NotFound
