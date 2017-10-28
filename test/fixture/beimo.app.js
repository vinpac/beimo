import React from 'react'

export default app => {
  app.configure({
    component: ({ children }) => <div id="abacate">{children}</div>
  })
}
