import React from 'react'
import PropTypes from 'prop-types'
import Router from '../modules/router'

class BeimoComponent extends React.Component {
  static propTypes = {
    route: PropTypes.shape({
      page: PropTypes.string.isRequired,
      props: PropTypes.object,
    }).isRequired,
    app: PropTypes.func,
    context: PropTypes.object, // eslint-disable-line
  }

  static defaultProps = {
    app: undefined,
    context: undefined,
  }

  constructor(props) {
    super(props)

    const { route } = props

    this.state = {
      route: { page: route.page },
      pageError: route.error,
      pageComponent: Router.requirePage(route.page),
      pageProps: route.props,
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
