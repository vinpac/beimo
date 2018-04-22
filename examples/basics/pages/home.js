import React from 'react'
import PropTypes from 'prop-types'
// import Toolbar from '../components/Toolbar'
import Link from '../../../dist/modules/router/link'
import Route from '../../../dist/modules/router/route'

const home = ({ className }) => (
  <div>
    <Link href="/project/post-1" prefetch>
      Tesasdasdasdasdweqeqqweqwqweqwqweqwqweqwqwe
    </Link>
    <Route path="/project/post-1">asdas</Route>
  </div>
)

home.displayName = 'home'
home.propTypes = {
  className: PropTypes.string,
}
home.defaultProps = {
  className: undefined,
}

export default home
