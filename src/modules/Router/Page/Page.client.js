import React from 'react'
import PropTypes from 'prop-types'
import queryString from 'query-string'
import { Route } from 'react-router-dom'
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
    }
  }

  componentWillMount() {
    const { loadChunk, load, component, chunkName } = this.props

    if (!APP_STATE.page.rendered) {
      APP_STATE.page.rendered = true
      return
    }

    if (!component) {
      loadChunk(chunkName, load)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.component !== this.props.component) {
      this.loadInitialProps(nextProps.component)
    }

    if (
      this.props.location.search !== nextProps.location.search ||
      this.props.location.pathname !== nextProps.location.pathname
    ) {
      if (!this.state.component) {
        nextProps
          .loadChunk(this.props.chunkName, nextProps.load)
          .then(({ default: component }) => {
            this.setState({ component })
            this.loadInitialProps(component)
          })
      } else {
        this.loadInitialProps(this.state.component, nextProps)
      }
    }
  }

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

    this.setState({ error, initialProps, errorComponent })
  }

  async loadInitialProps(
    component,
    { resolveArgs, location, match, resolveErrorPage } = this.props,
  ) {
    if (component.getInitialProps) {
      const yieldProps = props =>
        this.setState({
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
    const { initialProps, error, errorComponent: ErrorComponent } = this.state

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
