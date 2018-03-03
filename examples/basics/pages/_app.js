import React from 'react'
import PropTypes from 'prop-types'

const App = ({ children }) => (
  <div className="app123">
    {children}
  </div>
)

App.displayName = 'App'
App.getSharedState = sharedState => {
  return { ...sharedState, initialReduxState: 'qweqwe' }
}
App.getContext = () => {
  return {}
}
export default App
