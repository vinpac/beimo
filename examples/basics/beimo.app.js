import React, { Fragment } from 'react'
import Head from 'beimo/head'
import { TransitionGroup, CSSTransition } from 'react-transition-group'

export default app => {
  app.configure({
    component: ({ children, location, isLoadingChunk, store }) => (
      <Fragment>
        <Head>
          <link
            href="https://fonts.googleapis.com/css?family=Roboto:400,400i,500"
            rel="stylesheet"
          />
        </Head>
        <TransitionGroup>
          <CSSTransition
            key={location.key || '/'}
            timeout={{ enter: 300, exit: 200 }}
            classNames="fade"
            appear
          >
            <div>{children}</div>
          </CSSTransition>
        </TransitionGroup>
        {store.getState().user.fullName}
      </Fragment>
    ),
    getComponentProps: ({ req, initialReduxState }) => {
      const initialState = initialReduxState || { user: req.user || { fullName: 'John doe' } }
      const store = { dispatch: () => {}, getState: () => initialState }

      return { store }
    },
    getPageArgs: (args, { store }) => ({ ...args, store }),
    getSharedState: (sharedState, { store }) => ({
      ...sharedState,
      initialReduxState: store.getState(),
    }),
  })
}
