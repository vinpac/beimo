import React from 'react'
import PropTypes from 'prop-types'
import beimo from '../../..'

class App extends React.Component {
  state = { loading: false }
  componentDidMount() {
    beimo.hooks.state.tap(this.handleBeimoStateChange)
  }

  componentWillUnmount() {
    beimo.hooks.state.untap(this.handleBeimoStateChange)
  }

  handleBeimoStateChange = beimoState => {
    const loading = beimoState !== '@@beimo/rendered'
    if (loading !== this.state.loading) {
      this.setState({ loading })
    }
  }

  render() {
    const { children } = this.props
    const { loading } = this.state

    return (
      <div className="app">
        {loading && 'Carregando'}
        {children}
      </div>
    )
  }
}

export default App
