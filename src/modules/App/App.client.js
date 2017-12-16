import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { BrowserRouter, Switch } from 'react-router-dom'
import Page from '../Router/Page'
import { isPage } from '../Router'

class AppComponent extends React.Component {
  static propTypes = {
    component: PropTypes.func,
    pages: PropTypes.arrayOf(
      PropTypes.shape({ chunkName: PropTypes.string.isRequired, load: PropTypes.func.isRequired }),
    ).isRequired,
    resolveErrorPage: PropTypes.func.isRequired,
    resolvePageArgs: PropTypes.func.isRequired,
  }

  static defaultProps = { component: null }

  constructor(props) {
    super(props)

    this.chunksPromisesMap = {}
    this.state = { pages: props.pages }
  }

  loadChunk = (chunkName, loadFn) => {
    console.log('load Chunk')
    if (!this.chunksPromisesMap[chunkName]) {
      this.chunksPromisesMap[chunkName] = loadFn().then(chunk => {
        this.setState({
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
    const { component: Component, resolvePageArgs, resolveErrorPage } = this.props
    const { pages } = this.state

    const children = (
      <Switch>
        {pages.map((page, i) => (
          <Page
            key={i} //eslint-disable-line
            {...page}
            resolveArgs={resolvePageArgs}
            resolveErrorPage={resolveErrorPage}
            loadChunk={this.loadChunk}
          />
        ))}
      </Switch>
    )

    return (
      <BrowserRouter>{this.component ? <Component>{children}</Component> : children}</BrowserRouter>
    )
  }
}

export default class App {
  constructor({ pages = [], resolveErrorPage, component, resolvePageArgs }) {
    this.pages = pages
    this.component = component
    this.resolvePageArgs = resolvePageArgs || (args => args)
    this.resolveErrorPage = resolveErrorPage
    this.chunks = {}

    this.state = { pages }
  }

  configure({ pages, component, resolvePageArgs, resolveErrorPage }) {
    if (pages !== undefined) this.pages = this.pages
    if (resolvePageArgs !== undefined) this.resolvePageArgs = resolvePageArgs
    if (component !== undefined) this.component = component
    if (resolveErrorPage !== undefined) this.resolveErrorPage = resolveErrorPage
  }

  // eslint-disable-next-line
  handle() {
    throw new Error('handle is a server only method. Use hydrate instead.')
  }

  async hydrate(element) {
    this.hydrateKey = Date.now()

    const { page: { error } } = window.APP_STATE

    if (error) {
      const errorPage = this.resolveErrorPage(error)

      if (isPage(errorPage)) {
        errorPage.component = await errorPage.load().then(({ default: component }) => component)
      }
    } else {
      const renderedPage = this.state.pages.find(p => p.id === window.APP_STATE.page.id)

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

    this.appInstance = ReactDOM.hydrate(this.render(), element)
  }

  loadChunk = (chunkName, fn) => {
    if (!this.chunks[chunkName]) {
      this.chunks[chunkName] = fn().then(chunk => {
        this.setState({
          pages: this.state.pages.map(page => {
            if (page.chunkName === chunkName) {
              return { ...page, component: chunk.component }
            }

            return page
          }),
        })
      })
    }

    return this.chunks[chunkName]
  }

  render() {
    return (
      <AppComponent
        key={this.hydrateKey}
        pages={this.pages}
        resolveErrorPage={this.resolveErrorPage}
        resolvePageArgs={this.resolvePageArgs}
        component={this.component}
      />
    )
  }
}
