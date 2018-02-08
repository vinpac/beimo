import PropTypes from 'prop-types'
import Router from 'beimo/router'

const Redirect = ({ to, replace }) => {
  Router.incorporate(to, replace ? 'replace' : 'push')
  return null
}

Redirect.displayName = 'Redirect'
Redirect.propTypes = { to: PropTypes.string.isRequired, replace: PropTypes.bool }
export default Redirect
