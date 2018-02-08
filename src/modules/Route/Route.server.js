import React from 'react'
import PropTypes from 'prop-types'
import { createMatcher, matchPage } from '../Router'

const Route = ({ path, miss, children, component: Component, render, ...props }, { router }) => {
  const { location } = router
  const matcher = createMatcher(path, props)
  const match = matchPage(location.path, { matcher })

  if (Component) {
    return <Component location={location} match={match} />
  }

  if (render) {
    return render({ location, match })
  }

  if (match) {
    return children
  }

  return miss || null
}

Route.displayName = 'Route'
Route.propTypes = {
  component: PropTypes.func,
  render: PropTypes.func,
  path: PropTypes.string.isRequired,
  children: PropTypes.node,
  miss: PropTypes.node,
}

Route.defaultProps = {
  children: undefined,
  component: undefined,
  render: undefined,
  miss: undefined,
}
Route.defaultProps = {
  children: undefined,
}

Route.contextTypes = {
  router: PropTypes.shape({ location: PropTypes.object.isRequired }).isRequired,
}

export default Route
