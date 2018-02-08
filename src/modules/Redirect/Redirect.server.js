import PropTypes from 'prop-types'

const Redirect = ({ to }, { router }) => {
  router.response.redirect = to
  return null
}

Redirect.displayName = 'Redirect'
Redirect.propTypes = {
  to: PropTypes.string.isRequired,
}
Redirect.contextTypes = {
  router: PropTypes.shape({ location: PropTypes.object.isRequired }).isRequired,
}

export default Redirect
