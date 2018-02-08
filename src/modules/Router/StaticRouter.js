import React from 'react'
import PropTypes from 'prop-types'

class StaticRouter extends React.Component {
  static propTypes = {
    response: PropTypes.object, // eslint-disable-line
    location: PropTypes.shape({ path: PropTypes.string.isRequired }).isRequired,
    children: PropTypes.node.isRequired,
  }

  static childContextTypes = {
    router: PropTypes.shape({ path: PropTypes.string.isRequired }).isRequired,
  }

  getChildContext() {
    const { location, response } = this.props
    return { router: { location, response } }
  }

  render() {
    return this.props.children
  }
}

export default { StaticRouter }
