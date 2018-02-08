import React from 'react'
import PropTypes from 'prop-types'
import Router from '../Router'

const Link = ({ to, children, onClick, ...props }) => (
  <a
    {...props}
    href={to}
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
        Router.incorporate(to)
      }
    }}
  >
    {children}
  </a>
)

Link.displayName = 'Link'
Link.propTypes = {
  to: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  children: PropTypes.node,
}
Link.defaultProps = {
  onClick: undefined,
  children: undefined,
}

export default Link
