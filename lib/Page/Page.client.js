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
    resolveErrorPage: PropTypes.func,
  }

  static defaultProps = { resolveErrorPage: undefined }

  constructor(props) {
    super(props)

    const pageError = initialAppPageMap[props.component.id] !== undefined
      ? window.APP_STATE.pageError
      : undefined

    this.state = {
      initialProps: initialAppPageMap[props.component.id],
      error: pageError,
      errorComponent: pageError && props.resolveErrorPage && props.resolveErrorPage(pageError),
    }
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

  handleError = (error, resolveErrorPage = this.props.resolveErrorPage) => {
    const errorPage = resolveErrorPage(error)
    if (!errorPage) {
      this.setState({ error })
      return
    }

    const yieldProps = props => this.setState({ initialProps: props })
    let initialProps = {}
    const response = {}

    if (errorPage.getInitialProps) {
      const promise = errorPage.getInitialProps({
        error,
        yieldProps,
        response,
      })

      if (promise instanceof Promise) {
        promise
          .then(yieldProps)
          .catch(newError => this.setState({ error: newError, errorComponent: null }))
      } else {
        initialProps = promise
      }
    } else {
      initialProps.error = error
    }

    this.setState({ error, initialProps, errorComponent: errorPage })
  }

  async loadInitialProps({
    resolveArgs,
    location,
    component,
    match,
    resolveErrorPage,
  } = this.props) {
    if (component.getInitialProps) {
      const yieldProps = props => this.setState({
        error: null,
        errorComponent: null,
        initialProps: props,
      })
      const response = {}
      try {
        const newProps = component.getInitialProps(
          resolveArgs({
            ...match,
            query: queryString.parse(location.search),
            yieldProps,
            response,
          }),
        )

        if (newProps instanceof Promise) {
          newProps
            .then(yieldProps)
            .catch(error => this.handleError(error, resolveErrorPage))
        } else {
          yieldProps(newProps)
        }
      } catch (error) {
        this.handleError(error, resolveErrorPage)
      }
    }
  }

  render() {
    const { component: Component } = this.props
    const { initialProps, error, errorComponent: ErrorComponent } = this.state

    if (error) {
      if (ErrorComponent) {
        return (
          <ErrorComponent error={error} {...initialProps} />
        )
      }

      throw error
    }

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
