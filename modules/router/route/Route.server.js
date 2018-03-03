import React from 'react'
import PropTypes from 'prop-types'
import { createMatcher, matchPath } from '..'

const Route = (
  { path, fallback, children, component: Component, render, ...props },
  { router },
) => {
  const { location } = router
  const match = matchPath(location.path, createMatcher(path, props))

  if (Component) {
    return <Component location={location} match={match} />
  }

  if (render) {
    return render({ location, match })
  }

  if (match) {
    return children
  }

  return fallback
}

Route.displayName = 'Route'
Route.propTypes = {
  component: PropTypes.func,
  render: PropTypes.func,
  path: PropTypes.string.isRequired,
  children: PropTypes.node,
  fallback: PropTypes.node,
}

Route.defaultProps = {
  children: undefined,
  component: undefined,
  render: undefined,
  fallback: null,
}
Route.defaultProps = {
  children: undefined,
}

Route.contextTypes = {
  router: PropTypes.shape({ location: PropTypes.object.isRequired }).isRequired,
}

export default Route
