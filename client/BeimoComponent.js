import React from 'react'
import PropTypes from 'prop-types'
import Router from '../modules/router'

class BeimoComponent extends React.Component {
  static propTypes = {
    route: PropTypes.shape({ page: PropTypes.string }).isRequired,
    loadedProps: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    error: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    app: PropTypes.func,
    context: PropTypes.object, // eslint-disable-line
  }

  static defaultProps = {
    loadedProps: {},
    error: undefined,
    app: undefined,
    context: undefined,
  }

  constructor(props) {
    super(props)

    const { route, error, loadedProps } = props

    this.state = {
      route,
      pageComponent: Router.requirePage(route.page),
      pageError: error,
      pageProps: loadedProps,
    }
  }

  componentWillMount() {
    Router.onLoad(this.handleRouterChange)
  }

  // eslint-disable-next-line
  send({ redirect }) {
    if (redirect) {
      Router.incorporate(redirect)
    }
  }

  handleRouterChange = async (pageOrRoute, match, error) => {
    const { context, app } = this.props
    const route = typeof pageOrRoute === 'string' ? { page: pageOrRoute } : pageOrRoute
    const component = await Router.requirePage(route.page)
    const stateOverrides = {
      route,
      pageComponent: component,
      pageProps: {},
      pageError: error,
      context,
    }
    let stateDispatched = false

    const yieldProps = props => {
      if (props) {
        if (!stateDispatched) {
          stateOverrides.pageProps = props
          return
        }

        this.setState({ pageProps: props })
      }
    }

    if (component.getInitialProps) {
      let params = {
        ...match,
        error,
        yieldProps,
        send: this.send,
        props: route.props,
      }

      if (app && app.getLoadPropsParams) {
        params = app.getLoadPropsParams(params, context)
      }

      const props = component.getInitialProps(params)

      if (props && props instanceof Promise) {
        this.setState(stateOverrides)
        stateDispatched = true
        await props.then(yieldProps)
      } else {
        yieldProps(props)
        this.setState(stateOverrides)
        stateDispatched = true
      }
    } else {
      this.setState(stateOverrides)
    }
  }

  render() {
    const { app: App, context } = this.props
    const { route, pageProps, pageError, pageComponent: PageComponent } = this.state

    if (App) {
      return (
        <App page={route.page} location={Router.location} context={context}>
          <PageComponent {...route.props} error={pageError} {...pageProps} />
        </App>
      )
    }

    return <PageComponent {...route.props} error={pageError} {...pageProps} />
  }
}

export default BeimoComponent
