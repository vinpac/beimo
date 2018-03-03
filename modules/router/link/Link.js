import React from 'react'
import PropTypes from 'prop-types'
import Router from '..'

const Link = ({ href, component: Component, children, onClick, ...props }) => (
  <Component
    {...props}
    href={href}
    onClick={event => {
      event.preventDefault()
      let prevented
      if (onClick) {
        onClick({
          ...event,
          preventDefault: () => { prevented = true }
        })
      }

      if (!prevented) {
        Router.incorporate(href)
      }
    }}
  >
    {children}
  </Component>
)

Link.displayName = 'Link'
Link.propTypes = {
  component: PropTypes.string,
  href: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  children: PropTypes.node,
}
Link.defaultProps = {
  component: 'a',
  onClick: undefined,
  children: undefined,
}

export default Link
