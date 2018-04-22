import React from 'react'
import PropTypes from 'prop-types'
import beimo from '../../../..' // eslint-disable-line

class Link extends React.Component {
  static propTypes = {
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    href: PropTypes.string.isRequired,
    prefetch: PropTypes.bool,
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
  }

  static defaultProps = {
    component: 'a',
    prefetch: false,
    onClick: undefined,
    onMouseEnter: undefined,
  }

  handleClick = event => {
    const { href, onClick } = this.props
    if (onClick) {
      onClick(event)
    }

    if (event.isDefaultPrevented()) {
      return
    }

    event.preventDefault()
    beimo.history.push(href)
  }

  handleMouseEnter = event => {
    const { onMouseEnter } = this.props
    if (onMouseEnter) {
      onMouseEnter(event)
    }

    if (event.isDefaultPrevented()) {
      return
    }

    this.prefetch()
  }

  prefetch = () => {
    const { route } = beimo.matchPath(this.props.href)
    if (route) {
      return beimo.loadPage(route.page)
    }

    return null
  }

  render() {
    const { component: Component, onClick, prefetch, onMouseEnter, ...props } = this.props

    return (
      <Component
        {...props}
        onClick={this.handleClick}
        onMouseEnter={prefetch ? this.handleMouseEnter : onMouseEnter}
      />
    )
  }
}

export default Link
