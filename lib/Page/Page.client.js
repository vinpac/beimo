import React from 'react'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import { Route } from 'react-router-dom'
import { Wrap } from '../utils'

const initialAppPageMap = window.APP_STATE.pagesProps || {}
class Page extends React.Component {
  static propTypes = {
    component: PropTypes.func.isRequired,
    location: Route.propTypes.location.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = { initialProps: initialAppPageMap[props.component.id] }
  }

  componentWillMount() {
    if (initialAppPageMap[this.props.component.id]) {
      initialAppPageMap[this.props.component.id] = null
      return
    }

    this.loadInitialProps()
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.location.search !== nextProps.location.search ||
      this.props.location.pathname !== nextProps.location.pathname
    ) {
      this.loadInitialProps(nextProps)
    }
  }

  async loadInitialProps({ resolveArgs, location, component, match } = this.props) {
    if (component.getInitialProps) {
      const yieldProps = props => props !== undefined && this.setState({ initialProps: props })
      const context = {}
      const newProps = component.getInitialProps(
        resolveArgs({
          ...match,
          query: queryString.parse(location.search),
          yieldProps,
          context,
        }),
      )

      if (newProps instanceof Promise) {
        newProps.then(yieldProps)
      } else {
        yieldProps(newProps)
      }
    }
  }

  render() {
    const { component: Component } = this.props
    const { initialProps } = this.state

    return (
      <Wrap>
        <Component {...initialProps} />
      </Wrap>
    )
  }
}

const PageConnect = props => (
  <Route
    path={props.path}
    exact={props.exact}
    render={subprops => <Page {...props} {...subprops} />}
  />
)

PageConnect.displayName = 'PageConnect'
PageConnect.propTypes = {
  exact: PropTypes.bool,
  path: PropTypes.string,
  resolveArgs: PropTypes.func.isRequired,
}
PageConnect.defaultProps = { exact: true, path: undefined }

export default PageConnect
