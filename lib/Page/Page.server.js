import React from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'

const Page = ({ initialProps, errorComponent: ErrorComponent, error, component: Component }) => {
  if (error) {
    return (
      <ErrorComponent error={error} {...initialProps} />
    )
  }

  return <Component {...initialProps} />
}

Page.propTypes = {
  component: PropTypes.func.isRequired,
  errorComponent: PropTypes.func,
  error: PropTypes.object, //eslint-disable-line
  initialProps: PropTypes.object, //eslint-disable-line
}
Page.defaultProps = {
  errorComponent: undefined,
  error: undefined,
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

