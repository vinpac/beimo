/* @flow */
import React from 'react'
import PropTypes from 'prop-types'
import beimo from '../../../client'
import type { Location } from '../../../modules/router/core'

export type Props = {
  context: {},
  app: ?Function,
  page: string,
  location: Location,
  renderedPage: string,
  renderedPageProps: {},
  renderedPageComponent: Function,
}

type State = {
  location: Location,
  page: string,
  pageProps: {},
  pageComponent: Function,
}

class BrowserRouter extends React.Component<Props, State> {
  static childContextTypes = {
    router: PropTypes.shape({
      location: PropTypes.shape({
        path: PropTypes.string.isRequired,
        pathname: PropTypes.string.isRequired,
        search: PropTypes.string.isRequired,
      }),
    }),
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      location: props.location,
      page: props.renderedPage,
      pageComponent: props.renderedPageComponent,
      pageProps: props.renderedPageProps,
    }
  }

  getChildContext() {
    return { router: { location: this.state.location } }
  }

  componentDidMount() {
    beimo.hooks.render.tap(this.handleBeimoPageChange)
  }

  handleBeimoPageChange = (
    page: string,
    pageComponent: Function,
    pageProps: {},
    location: Location,
  ) => {
    this.setState({ page, pageComponent, pageProps, location })
  }

  render() {
    const { app: App, context } = this.props
    const { location, page, pageComponent: PageComponent, pageProps } = this.state

    return App ? (
      <App page={page} context={context} location={location}>
        <PageComponent {...pageProps} />
      </App>
    ) : (
      <PageComponent {...pageProps} />
    )
  }
}

export default BrowserRouter
