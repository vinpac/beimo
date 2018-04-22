/* @flow */
import React from 'react'
import ReactDOM from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import Hook from '../modules/hook'
import BrowserRouter, { PageNotFoundError, Redirect } from '../modules/router'
import { matchPath, simulateMatch } from '../modules/router/core'
import type { Match } from '../modules/router/core'
import type { History } from 'history' // eslint-disable-line import/first
import type { Route, RouterMap } from '../build/create-router-map'

export const STATE_RENDERED = '@@beimo/rendered'
export const STATE_LOADING_CHUNK = '@@beimo/loadingChunk'
export const STATE_LOADING_PROPS = '@@beimo/loadingProps'

type BeimoState = '@@beimo/rendered' | '@@beimo/loadingChunk' | '@@beimo/loadingProps'

class Beimo {
  currentPage: string
  routes: Route[]
  pages: string[]
  buildId: string
  assetPath: string
  context: {}
  chunks: { [string]: any }
  chunksOnLoadConsumers: { [string]: Function[] }
  hooks: { render: Hook, state: Hook }
  loadTimeout: number
  history: History
  location: {
    path: string,
    pathname: string,
    search: string,
  }
  app: Function
  appPromise: Promise<Function>
  state: BeimoState

  constructor(map: RouterMap, buildId: string, history: History = createBrowserHistory()) {
    this.routes = map.routes
    this.pages = map.pages
    this.buildId = buildId
    this.assetPath = `/_beimo_/${buildId}`
    this.context = {}
    this.chunks = {}
    this.chunksOnLoadConsumers = {}
    this.state = STATE_RENDERED
    this.hooks = {
      render: new Hook('Render hook'),
      state: new Hook('State hook'),
    }
    this.currentPage = window.APP_STATE.route.page
    this.loadTimeout = 3000

    // History
    this.history = history
    this.history.listen(this.handle)
    this.location = {
      path: `${this.history.location.pathname}${this.history.location.search}`,
      pathname: this.history.location.pathname,
      search: this.history.location.search,
    }

    if (document.getElementById('__BEIMO_PAGE__/_app')) {
      this.appPromise = this.loadPage('_app')
        .then((component: Function) => {
          if (this.app && this.app.getContext) {
            const { route, ...sharedState } = window.APP_STATE
            this.context = this.app.getContext(sharedState)
          }

          this.app = component
          return this.app
        })
        .catch(error => {
          console.error(error)
          return error
        })
    }

    /* eslint-disable no-underscore-dangle */
    window.__BEIMO_REGISTER_PAGE = (page, load) => {
      const name = `pages/${page}`
      this.chunks[name] = load()
      if (this.chunksOnLoadConsumers[name]) {
        this.chunksOnLoadConsumers[name] = this.chunksOnLoadConsumers[name].filter(fn => {
          fn(this.chunks[name])
          return false
        })
      }
    }

    if (window.__BEIMO_REGISTERED_PAGES) {
      window.__BEIMO_REGISTERED_PAGES.forEach(arr => window.__BEIMO_REGISTER_PAGE.apply(this, arr))
      delete window.__BEIMO_REGISTERED_PAGES
    }

    if (module.hot) {
      window.__BEIMO_HOT_UPDATE = (page, component) => {
        if (this.chunks[`pages/${page}`]) {
          this.chunks[`pages/${page}`] = component
          this.reload()
        }
      }

      window.__BEIMO_HOT_UPDATE_PAGES = ({ routes, pages }) => {
        this.routes = routes
        this.pages = pages
        this.reload()
      }
    }
    /* eslint-enable no-underscore-dangle */
  }

  matchPath = (url: string): { route: ?Route, match: ?Match } => {
    let match
    const matchedRoute = this.routes.find(route => {
      match = matchPath(url, route.matcher)
      return match
    })

    return { route: matchedRoute || null, match }
  }

  handle = async (location: { pathname: string, search: string, pathname: string }) => {
    this.location = {
      path: `${location.pathname}${location.search}`,
      pathname: location.pathname,
      search: location.search,
    }

    const { route, match } = this.matchPath(this.location.path)

    try {
      if (!route) {
        throw new PageNotFoundError()
      }

      await this.render(route.page, route, match)
    } catch (error) {
      if (error instanceof Redirect) {
        this.history[error.action](error.to)
        return
      }

      await this.render('_error', undefined, error)
    }
  }

  reload = () => this.handle(this.location)

  isValidPage = (page: string): boolean =>
    page !== '_document' && (page === '_error' || page === '_app' || this.pages.includes(page))

  loadPage = (page: string): Promise<Function> | Function => {
    const chunkName = `pages/${page}`
    if (this.chunks[chunkName]) {
      return this.chunks[chunkName]
    }

    if (!this.isValidPage(page)) {
      throw new PageNotFoundError()
    }

    this.chunks[chunkName] = new Promise((resolve, reject) => {
      if (!document.getElementById(`__BEIMO_PAGE__/${page}`)) {
        const script = document.createElement('script')
        script.src = `/_beimo_/${this.buildId}/pages/${page}.js`
        if (document.head) {
          document.head.appendChild(script)
        }
      }

      if (!this.chunksOnLoadConsumers[chunkName]) {
        this.chunksOnLoadConsumers[chunkName] = []
      }

      let resolved
      const timeout = setTimeout(() => {
        if (resolved) {
          return
        }

        reject(
          new Error(`Chunk '${chunkName}' was not loaded within the ${this.loadTimeout}ms timeout`),
        )
      }, this.loadTimeout)

      this.chunksOnLoadConsumers[chunkName].push(component => {
        resolved = true
        clearTimeout(timeout)
        resolve(component)
      })
    })

    return this.chunks[chunkName]
  }

  setState = (newState: BeimoState) => {
    if (this.state !== newState) {
      this.state = newState
      this.hooks.state.call(newState)
    }
  }

  render = async (
    page: string,
    route: ?Route,
    match: ?Match = route
      ? matchPath(this.location.path, route.matcher)
      : simulateMatch(this.location.path),
    error: ?Error,
  ) => {
    this.currentPage = page
    this.setState(STATE_LOADING_CHUNK)
    const component = await this.loadPage(page)
    let props = {}

    if (this.currentPage !== page) {
      return
    }

    const dispatch = () => {
      if (this.currentPage !== page) {
        return
      }

      this.hooks.render.call(
        page,
        component,
        route
          ? {
              ...route.props,
              error,
              ...props,
            }
          : { error, ...props },
      )
    }

    if (component.getInitialProps) {
      let renderCalled = false

      const render = renderProps => {
        if (renderCalled) {
          throw new Error('Render was called more than once')
        }

        renderCalled = true
        if (renderProps) {
          props = renderProps
        }

        dispatch()
      }

      let params = {
        ...match,
        error,
        props: (route && route.props) || {},
        render,
      }

      if (this.app && this.app.mapGetInialPropsArgs) {
        params = this.app.mapGetInialPropsArgs(params, this.context)
      }

      try {
        const initialProps = component.getInitialProps(params)

        if (initialProps instanceof Promise) {
          this.setState(STATE_LOADING_PROPS)
          await initialProps
        }

        if (initialProps !== undefined) {
          if (typeof initialProps !== 'object') {
            throw new Error('getInitialProps must resolve in an object or undefined')
          }

          props = initialProps
        }
      } catch (thrownError) {
        props = { ...props, error: thrownError }
      }
    }

    if (this.currentPage === page) {
      dispatch()
      this.setState(STATE_RENDERED)
    }
  }

  async hydrate(element: Element): Promise<void> {
    await this.appPromise
    const { id, page, error, initialProps } = window.APP_STATE.route
    const route: ?Route = id ? this.routes.find(r => r.id === id) : null
    const pageComponent = await this.loadPage(page)

    ReactDOM.hydrate(
      <BrowserRouter
        context={this.context}
        app={this.app}
        page={page}
        location={this.location}
        renderedPage={page}
        renderedPageProps={
          route ? { ...route.props, error, ...initialProps } : { error, ...initialProps }
        }
        renderedPageComponent={pageComponent}
      />,
      element,
    )
  }
}

export default Beimo
