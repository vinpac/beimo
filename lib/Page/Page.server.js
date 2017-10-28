import React from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'

const Page = ({ initialProps, component: Component }) => (
  <Component {...initialProps} />
)

Page.propTypes = {
  component: PropTypes.func.isRequired,
  initialProps: PropTypes.object, //eslint-disable-line
}
Page.displayName = 'Page'

const PageConnect = props => (
  <Route
    path={props.path}
    exact={props.exact}
    render={subprops => (
      <Page
        {...props}
        {...subprops}
      />
    )}
  />
)

PageConnect.displayName = 'PageConnect'
PageConnect.propTypes = {
  exact: PropTypes.bool,
  path: PropTypes.string,
}
PageConnect.defaultProps = { exact: true, path: undefined }

export default PageConnect

