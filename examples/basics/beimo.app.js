import React, { Fragment } from 'react'
import Head from 'beimo/head'

export default app => {
  app.configure({
    getInitialProps: ({ req, initialReduxState }) => {
      const initialState = initialReduxState || { user: req.user || { fullName: 'John doe' } }
      const store = { dispatch: () => { }, getState: () => initialState }

      return { store }
    },
    getPageArgs: (args, { store }) => ({ ...args, store }),
    getSharedState: (sharedState, { store }) => ({
      ...sharedState,
      initialReduxState: store.getState(),
    }),
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
