import React, { Fragment } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { withRouter, BrowserRouter, Switch } from 'react-router-dom'
import Page from '../Router/Page'
import { isPage } from '../Router'

class AppComponent extends React.Component {
  static propTypes = {
    initialChunkName: PropTypes.string,
    component: PropTypes.func,
    pages: PropTypes.arrayOf(
      PropTypes.shape({
        chunkName: PropTypes.string.isRequired,
        load: PropTypes.func.isRequired,
      }),
    ).isRequired,
    getErrorPage: PropTypes.func.isRequired,
    getPageArgs: PropTypes.func.isRequired,
    componentProps: PropTypes.object.isRequired, // eslint-disable-line
  }

  static defaultProps = {
    initialChunkName: null,
    component: null,
  }

  constructor(props) {
    super(props)

    this.chunksPromisesMap = {}
    this.state = { pages: props.pages }
    this.currentPageChunkName = props.initialChunkName
  }

  getPageArgs = args => this.props.getPageArgs(args, this.props.componentProps)

  handlePageWillMount = ref => {
    if (ref.props.chunkName !== this.currentPageChunkName) {
      const hasComponent = !!ref.props.component
      if (!hasComponent) {
        this.setState({ lastRenderedPage: this.currentPageRef.render() })
      }
    }

    this.currentPageChunkName = ref.props.chunkName
    this.currentPageRef = ref
  }

  loadChunk = (chunkName, loadFn) => {
    if (!this.chunksPromisesMap[chunkName]) {
      this.setState({ isLoadingChunk: true })
      this.chunksPromisesMap[chunkName] = loadFn().then(chunk => {
        this.setState({
          lastRenderedPage: null,
          isLoadingChunk: false,
          pages: this.state.pages.map(page => {
            if (page.chunkName === chunkName) {
              return { ...page, component: chunk.default }
            }

            return page
          }),
        })
      })
    }

    return this.chunksPromisesMap[chunkName]
  }

  render() {
    const { component: Component, location, componentProps, getErrorPage } = this.props
    const { pages, isLoadingChunk, lastRenderedPage } = this.state

    const children = (
      <Fragment>
        {lastRenderedPage}
        <Switch location={location}>
          {pages.map(page => (
            <Page
              key={page.id} //eslint-disable-line
              {...page}
              getArgs={this.getPageArgs}
              getErrorPage={getErrorPage}
              loadChunk={this.loadChunk}
              onWillMount={this.handlePageWillMount}
            />
          ))}
        </Switch>
      </Fragment>
    )

    return Component ? (
      <Component location={location} isLoadingChunk={isLoadingChunk} {...componentProps}>
        {children}
      </Component>
    ) : children
  }
}

const AppComponentWithRouter = withRouter(AppComponent)

export default class App {
  constructor({ pages = [], component, getComponentProps, getPageArgs, getErrorPage }) {
    this.pages = pages
    this.component = component
    this.getComponentProps = getComponentProps || (() => ({}))
    this.getPageArgs = getPageArgs || (args => args)
    this.getErrorPage = getErrorPage
    this.chunks = {}
  }

  configure({ pages, component, getComponentProps, getPageArgs, getErrorPage }) {
    if (pages !== undefined) this.pages = pages
    if (component !== undefined) this.component = component

    // Getters
    if (getComponentProps !== undefined) this.getComponentProps = getComponentProps
    if (getPageArgs !== undefined) this.getPageArgs = getPageArgs
    if (getErrorPage !== undefined) this.getErrorPage = getErrorPage
  }

  // eslint-disable-next-line
  handle() {
    throw new Error('handle is a server only method. Use hydrate instead.')
  }

  async hydrate(element) {
    this.hydrateKey = Date.now() || this.hydrateKey + 1

    const { page: { error } } = window.APP_STATE
    let initialChunkName

    if (error) {
      const errorPage = this.getErrorPage(error)

      if (isPage(errorPage)) {
        errorPage.component = await errorPage.load().then(({ default: component }) => component)
      }
    } else {
      const renderedPage = this.pages.find(p => p.id === window.APP_STATE.page.id)
      initialChunkName = renderedPage.chunkName

      if (renderedPage) {
        // Load rendered page chunk and set it to every page that uses this chunk
        await renderedPage.load().then(({ default: component }) => {
          this.pages = this.pages.map(page => {
            if (page.chunkName === renderedPage.chunkName) {
              return { ...page, component }
            }

            return page
          })
        })
      }
    }

    this.instance = ReactDOM.hydrate(this.render(initialChunkName), element)
  }

  render(initialChunkName) {
    const { page, ...sharedState } = window.APP_STATE

    return (
      <BrowserRouter>
        <AppComponentWithRouter
          key={this.hydrateKey}
          pages={this.pages}
          getErrorPage={this.getErrorPage}
          getPageArgs={this.getPageArgs}
          component={this.component}
          componentProps={this.getComponentProps(sharedState)}
          initialChunkName={initialChunkName}
        />
      </BrowserRouter>
    )
  }
}
