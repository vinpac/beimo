import React from 'react'
import PropTypes from 'prop-types'
import Route from '../Route'
import Link from '../Link'

const NavLink = ({
  to,
  style,
  className,
  onClick,
  children,
  activeClassName,
  activeStyle,
  ...props
}) => (
  <Route
    path={to}
    miss={
      <Link {...props} style={style} className={className} onClick={onClick} to={to}>
        {children}
      </Link>
    }
  >
    <Link
      to={to}
      className={`${className || ''}${activeClassName ? ` ${activeClassName}` : ''}`}
      style={{ ...style, ...activeStyle }}
    >
      {children}
    </Link>
  </Route>
)

NavLink.displayName = 'Link'
NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeClassName: PropTypes.string,
  style: PropTypes.object, // eslint-disable-line
  activeStyle: PropTypes.object, // eslint-disable-line
  onClick: PropTypes.func,
  children: PropTypes.node,
}

NavLink.defaultProps = {
  className: undefined,
  activeClassName: undefined,
  activeStyle: undefined,
  onClick: undefined,
  children: undefined,
}

export default NavLink
