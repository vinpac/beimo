import React from 'react'
import PropTypes from 'prop-types'
import Router from 'beimo/router'
import { createMatcher, matchPage } from '../Router'

class Route extends React.Component {
  static propTypes = {
    component: PropTypes.func,
    render: PropTypes.func,
    path: PropTypes.string.isRequired,
    children: PropTypes.node,
    miss: PropTypes.node,
  }

  static defaultProps = {
    children: undefined,
    component: undefined,
    render: undefined,
    miss: undefined,
  }

  constructor(props) {
    super(props)

    this.matcher = createMatcher(props.path, props)
    this.state = { match: matchPage(Router.location.path, this) }
  }

  componentWillMount() {
    this.unlisten = Router.history.listen(this.handleRouterChange)
  }

  componentWillReceiveProps({ path: nextPath, ...nextProps }) {
    if (this.props.path !== nextPath) {
      this.matcher = createMatcher(nextPath, nextProps)
      this.setState({ match: matchPage(Router.location.path, this)})
    }
  }

  componentWillUnmount() {
    this.unlisten()
  }

  handleRouterChange = location => {
    const match = matchPage(`${location.pathname}${location.search}`, this)

    if (this.state.match !== match) {
      this.setState({ match })
    }
  }

  render() {
    const { children, miss, component: Component, render } = this.props
    const { location } = Router
    const { match } = this.state

    if (Component) {
      return <Component location={location} match={match} />
    }

    if (render) {
      return render({ location, match })
    }

    return match ? children : miss || null
  }
}

export default Route
