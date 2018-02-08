import React from 'react'
import PropTypes from 'prop-types'
import Router from 'beimo/router'

class AppComponent extends React.Component {
  static propTypes = {
    defaultPage: PropTypes.shape({ id: PropTypes.string }).isRequired,
    defaultPageProps: PropTypes.object, // eslint-disable-line
    defaultPageError: PropTypes.object, // eslint-disable-line
    requirePageModule: PropTypes.func.isRequired,
    getLoadPropsParams: PropTypes.func.isRequired,
    component: PropTypes.func,
    context: PropTypes.object, // eslint-disable-line
  }

  static defaultProps = {
    component: undefined,
    context: undefined,
  }

  constructor(props) {
    super(props)

    const { defaultPage, requirePageModule, defaultPageProps, defaultPageError } = props

    this.state = {
      page: defaultPage,
      pageError: defaultPageError,
      pageComponent: requirePageModule(defaultPage.id),
      pageInitialProps: defaultPageProps,
    }
  }

  componentWillMount() {
    Router.setLoadHandler(this.handleRouterChange)
  }

  // eslint-disable-next-line
  send({ redirect }) {
    if (redirect) {
      Router.incorporate(redirect)
    }
  }

  handleRouterChange = async (page, match, error) => {
    const { requirePageModule, context, getLoadPropsParams } = this.props
    const component = await requirePageModule(page.id)
    const stateOverrides = {
      page,
      pageComponent: component,
      pageInitialProps: {},
      pageError: error,
      context,
    }
    let stateDispatched = false

    const yieldProps = props => {
      if (props) {
        if (!stateDispatched) {
          stateOverrides.pageInitialProps = props
          return
        }

        this.setState({ pageInitialProps: props })
      }
    }

    if (component.getInitialProps) {
      const initialProps = component.getInitialProps(
        getLoadPropsParams({
          ...match,
          error,
          yieldProps,
          send: this.send,
          props: page.props,
        }, context),
      )

      if (initialProps && initialProps instanceof Promise) {
        this.setState(stateOverrides)
        stateDispatched = true
        await initialProps.then(yieldProps)
      } else {
        yieldProps(initialProps)
        this.setState(stateOverrides)
        stateDispatched = true
      }
    } else {
      this.setState(stateOverrides)
    }
  }

  render() {
    const { component: Component, context } = this.props
    const { page, pageInitialProps, pageError, pageComponent: PageComponent } = this.state

    if (Component) {
      return (
        <Component pageId={page.id} location={Router.location} context={context}>
          <PageComponent {...page.props} error={pageError} {...pageInitialProps} />
        </Component>
      )
    }

    return <PageComponent {...page.props} error={pageError} {...pageInitialProps} />
  }
}

export default AppComponent
