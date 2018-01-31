import React, { Fragment } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { withRouter, BrowserRouter, Switch } from 'react-router-dom'
import Page from '../Router/Page'
import { isPage } from '../Router'

class AppComponent extends React.Component {
  static propTypes = {
    location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
    initialPageId: PropTypes.string,
    component: PropTypes.func,
    pages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        load: PropTypes.func.isRequired,
      }),
    ).isRequired,
    getErrorPage: PropTypes.func.isRequired,
    getPageArgs: PropTypes.func.isRequired,
    componentProps: PropTypes.object.isRequired, // eslint-disable-line
  }

  static defaultProps = {
    initialPageId: null,
    component: null,
  }

  constructor(props) {
    super(props)

    this.chunksPromisesMap = {}
    this.state = { pages: props.pages }
    this.currentPageId = props.initialPageId
  }

  getPageArgs = args => this.props.getPageArgs(args, this.props.componentProps)

  handlePageWillMount = ref => {
    if (ref.props.id !== this.currentPageId) {
      const hasComponent = !!ref.props.component
      if (!hasComponent) {
        // eslint-disable-next-line react/no-find-dom-node
        const node = ReactDOM.findDOMNode(this.currentPageRef)
        if (node && node.outerHTML) {
          this.setState({ lastRenderedPageHTML: node.outerHTML })
        }
      }
    }

    this.currentPageId = ref.props.id
    this.currentPageRef = ref
  }

  loadChunk = (chunkId, loadFn) => {
    if (!this.chunksPromisesMap[chunkId]) {
      this.setState({ isLoadingChunk: true })
      this.chunksPromisesMap[chunkId] = loadFn().then(chunk => {
        this.setState({
          lastRenderedPageHTML: null,
          isLoadingChunk: false,
          pages: this.state.pages.map(page => {
            if (page.id === chunkId) {
              return { ...page, component: chunk.default }
            }

            return page
          }),
        })
      })
    }

    return this.chunksPromisesMap[chunkId]
  }

  render() {
    const { component: Component, location, componentProps, getErrorPage } = this.props
    const { pages, isLoadingChunk, lastRenderedPageHTML } = this.state

    const children = (
      <Fragment>
        {lastRenderedPageHTML && (
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: lastRenderedPageHTML }} />
        )}
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
    ) : (
      children
    )
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
    let initialPageId

    if (error) {
      const errorPage = this.getErrorPage(error)

      if (isPage(errorPage)) {
        errorPage.component = await errorPage.load().then(({ default: component }) => component)
      }
    } else {
      const renderedPage = this.pages.find(p => p.id === window.APP_STATE.page.id)
      initialPageId = renderedPage.id

      if (renderedPage) {
        // Load rendered page chunk and set it to every page that uses this chunk
        await renderedPage.load().then(({ default: component }) => {
          this.pages = this.pages.map(page => {
            if (page.id === renderedPage.id) {
              return { ...page, component }
            }

            return page
          })
        })
      }
    }

    this.instance = ReactDOM.hydrate(this.render(initialPageId), element)
  }

  render(initialPageId) {
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
          initialPageId={initialPageId}
        />
      </BrowserRouter>
    )
  }
}
