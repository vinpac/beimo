import React from 'react'
import PropTypes from 'prop-types'
import Route from '../route'
import Link from '../link'

const NavLink = ({
  href,
  style,
  className,
  children,
  activeClassName,
  activeStyle,
  ...props
}) => (
  <Route
    path={href}
    fallback={
      <Link {...props} style={style} className={className} href={href}>
        {children}
      </Link>
    }
  >
    <Link
      {...props}
      href={href}
      className={`${className || ''}${activeClassName ? ` ${activeClassName}` : ''}`}
      style={{ ...style, ...activeStyle }}
    >
      {children}
    </Link>
  </Route>
)

NavLink.displayName = 'Link'
NavLink.propTypes = {
  href: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeClassName: PropTypes.string,
  style: PropTypes.object, // eslint-disable-line
  activeStyle: PropTypes.object, // eslint-disable-line
  children: PropTypes.node,
}

NavLink.defaultProps = {
  className: undefined,
  activeClassName: undefined,
  activeStyle: undefined,
  children: undefined,
}

export default NavLink
