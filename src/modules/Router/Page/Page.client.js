import React from 'react'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import { Route, Redirect } from 'beimo/router'
import { isPage } from '../index'

const { APP_STATE } = window
class Page extends React.Component {
  static propTypes = {
    component: PropTypes.func,
    loading: PropTypes.func,
    loadChunk: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    chunkName: PropTypes.string.isRequired,
    load: PropTypes.func.isRequired,
    location: Route.propTypes.location.isRequired,
    resolveErrorPage: PropTypes.func,
  }

  static defaultProps = {
    loading: undefined,
    resolveErrorPage: undefined,
    component: null,
  }

  constructor(props) {
    super(props)

    const isRenderedPage = APP_STATE.page.id === props.id && !APP_STATE.page.rendered
    let errorComponent

    if (isRenderedPage && APP_STATE.page.error && props.resolveErrorPage) {
      errorComponent = props.resolveErrorPage(APP_STATE.page.error)

      if (isPage(errorComponent)) {
        errorComponent = errorComponent.component
      }
    }

    this.state = {
      initialProps: isRenderedPage ? APP_STATE.page.props : undefined,
      error: isRenderedPage ? APP_STATE.page.error : undefined,
      errorComponent,
      redirectURL: undefined,
    }
  }

  componentWillMount() {
    const { loadChunk, load, component, chunkName } = this.props

    if (!APP_STATE.page.rendered) {
      APP_STATE.page.rendered = true
      return
    }

    if (component) {
      this.loadInitialProps(this.props)
    } else {
      loadChunk(chunkName, load)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { component, load, chunkName, loadChunk, location } = nextProps

    if (component !== this.props.component) {
      this.loadInitialProps(nextProps)
    }

    // When path change, but rendering the same page
    if (
      this.props.location.search !== location.search ||
      this.props.location.pathname !== location.pathname
    ) {
      if (component) {
        this.loadInitialProps(nextProps)
      } else {
        loadChunk(chunkName, load)
      }
    }
  }

  redirect = url => this.setState({ redirectURL: url })

  handleError = async (error, resolveErrorPage = this.props.resolveErrorPage) => {
    const errorPage = resolveErrorPage(error)
    let errorComponent = errorPage

    if (!errorPage) {
      this.setState({ error })
      return
    }

    if (isPage(errorPage)) {
      errorComponent = await errorPage.load().then(({ default: component }) => component)
    }

    const yieldProps = props => this.setState({ initialProps: props })
    let initialProps = {}
    const response = { redirect: this.redirect }

    if (errorComponent.getInitialProps) {
      const promise = errorComponent.getInitialProps({
        error,
        yieldProps,
        response,
        pageProps: errorPage.pageProps,
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

    this.setState({ error, initialProps, errorComponent })
  }

  async loadInitialProps({ component, pageProps, resolveArgs, location, match, resolveErrorPage }) {
    if (component.getInitialProps) {
      const yieldProps = props =>
        this.setState({
          error: null,
          errorComponent: null,
          initialProps: props,
        })
      const response = { redirect: this.redirect }
      try {
        const newProps = component.getInitialProps(
          resolveArgs({
            ...match,
            query: queryString.parse(location.search),
            yieldProps,
            response,
            pageProps,
          }),
        )

        if (newProps instanceof Promise) {
          newProps.then(yieldProps).catch(error => this.handleError(error, resolveErrorPage))
        } else {
          yieldProps(newProps)
        }
      } catch (error) {
        this.handleError(error, resolveErrorPage)
      }
    }
  }

  render() {
    const { loading: Loading, component: Component } = this.props
    const { redirectURL, initialProps, error, errorComponent: ErrorComponent } = this.state

    if (redirectURL) {
      return <Redirect to={redirectURL} />
    }

    if (error) {
      if (ErrorComponent) {
        return <ErrorComponent error={error} {...initialProps} />
      }

      throw error
    }

    if (!Component) {
      if (Loading) {
        return <Loading />
      }

      return null
    }

    return <Component {...initialProps} />
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
