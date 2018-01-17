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
      PropTypes.shape({
        chunkName: PropTypes.string.isRequired,
        load: PropTypes.func.isRequired,
      }),
    ).isRequired,
    getErrorPage: PropTypes.func.isRequired,
    getPageArgs: PropTypes.func.isRequired,
    componentProps: PropTypes.object.isRequired, // eslint-disable-line
  }

  static defaultProps = { component: null }

  constructor(props) {
    super(props)

    this.chunksPromisesMap = {}
    this.state = { pages: props.pages }
  }

  setPages = pages => this.setState({ pages })

  getPageArgs = args => this.props.getPageArgs(args, this.props.componentProps)

  loadChunk = (chunkName, loadFn) => {
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
    const { component: Component, componentProps, getErrorPage } = this.props
    const { pages } = this.state

    const children = (
      <Switch>
        {pages.map((page, i) => (
          <Page
            key={page.id} //eslint-disable-line
            {...page}
            getArgs={this.getPageArgs}
            getErrorPage={getErrorPage}
            loadChunk={this.loadChunk}
          />
        ))}
      </Switch>
    )
    return (
      <BrowserRouter>
        {Component ? <Component {...componentProps}>{children}</Component> : children}
      </BrowserRouter>
    )
  }
}

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

  async hydrate(element, updateIfPossible) {
    this.hydrateKey = Date.now() || this.hydrateKey + 1

    const { page: { error } } = window.APP_STATE

    if (error) {
      const errorPage = this.getErrorPage(error)

      if (isPage(errorPage)) {
        errorPage.component = await errorPage.load().then(({ default: component }) => component)
      }
    } else {
      const renderedPage = this.pages.find(p => p.id === window.APP_STATE.page.id)

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

    if (updateIfPossible && this.renderedAppCompoent) {
      this.renderedAppCompoent.setPages(this.pages)
      return
    }

    this.instance = ReactDOM.hydrate(this.render(), element)
  }

  render() {
    const { page, ...sharedState } = window.APP_STATE

    return (
      <AppComponent
        key={this.hydrateKey}
        ref={component => {
          this.renderedAppCompoent = component
        }}
        pages={this.pages}
        getErrorPage={this.getErrorPage}
        getPageArgs={this.getPageArgs}
        component={this.component}
        componentProps={this.getComponentProps(sharedState)}
      />
    )
  }
}
