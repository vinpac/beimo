import React from 'react'

export default app => {
  const store = { dispatch: () => {}, getState: () => ({ color: 'blue' }) }
  app.configure({
    // eslint-disable-next-line
    component: ({ children }) => <div id="app">{children}</div>,
    resolvePageArgs: args => ({ ...args, store }),
  })
}
