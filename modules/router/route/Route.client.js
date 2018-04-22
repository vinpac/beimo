import React from 'react'
import PropTypes from 'prop-types'
import beimo from '../../../..' // eslint-disable-line
import { createMatcher, matchPath } from '../core'

class Route extends React.Component {
  static propTypes = {
    component: PropTypes.func,
    render: PropTypes.func,
    path: PropTypes.string.isRequired,
    children: PropTypes.node,
    fallback: PropTypes.node,
  }

  static defaultProps = {
    children: undefined,
    component: undefined,
    render: undefined,
    fallback: null,
  }

  constructor(props) {
    super(props)

    this.matcher = createMatcher(props.path, props)
    this.state = { match: matchPath(beimo.location.path, this.matcher) }
  }

  componentWillMount() {
    this.unlisten = beimo.history.listen(this.handleRouterChange)
  }

  componentWillReceiveProps({ path: nextPath, ...nextProps }) {
    if (this.props.path !== nextPath) {
      this.matcher = createMatcher(nextPath, nextProps)
      this.setState({ match: matchPath(beimo.location.path, this.matcher) })
    }
  }

  componentWillUnmount() {
    this.unlisten()
  }

  handleRouterChange = location => {
    const match = matchPath(`${location.pathname}${location.search}`, this.matcher)

    if (this.state.match !== match) {
      this.setState({ match })
    }
  }

  render() {
    const { children, fallback, component: Component, render } = this.props
    const { location } = beimo
    const { match } = this.state

    if (Component) {
      return <Component location={location} match={match} />
    }

    if (render) {
      return render({ location, match })
    }

    return match ? children : fallback
  }
}

export default Route
