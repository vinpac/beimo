import React from 'react'
import PropTypes from 'prop-types'
import Style from '../../../dist/modules/style'
import s, { css } from './Toolbar.css'

const Toolbar = ({ background }) => (
  <div className={s.toolbar}>
    <Style css={css} variables={{ background }} />
    HOMEAODASI
  </div>
)

Toolbar.displayName = 'Toolbar'
Toolbar.propTypes = {
  background: PropTypes.string,
}
Toolbar.defaultProps = {
  background: '#333',
}

export default Toolbar
