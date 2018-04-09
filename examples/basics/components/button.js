import React from 'react'
import PropTypes from 'prop-types'

const button = ({ className }) => (
  <div>
    Buttonqweqweqweqw
  </div>
)

button.displayName = 'button'
button.propTypes = {
  className: PropTypes.string,
}
button.defaultProps = {
  className: undefined,
}

export default button
