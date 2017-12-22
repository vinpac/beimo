import React, { Fragment } from 'react'
import Head from 'beimo/head'

export default app => {
  app.configure({
    component: ({ children }) => (
      <Fragment>
        <Head>
          <link
            href="https://fonts.googleapis.com/css?family=Roboto:400,400i,500"
            rel="stylesheet"
          />
        </Head>
        {children}
      </Fragment>
    ),
  })
}
