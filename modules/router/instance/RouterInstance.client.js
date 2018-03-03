import createBrowserHistory from 'history/createBrowserHistory'
import { PageNotFoundError } from '../errors'
import { matchPath, buildLocation } from '../utils'
import routesMap from '__@@BEIMO_SOURCE__/pages/index.yml' // eslint-disable-line

class Router {
  constructor() {
    this.history = createBrowserHistory()
    this.onRegisterCallbacks = {}
    this.location = {
      pathname: this.history.location.pathname,
      search: this.history.location.search,
      path: `${this.history.location.pathname}${this.history.location.search}`,
    }
    this.routes = routesMap.routes
    this.pages = routesMap.pages
    this.page = window.APP_STATE.route.page
    this.entries = {}

    this.history.listen(location => {
      this.location = {
        pathname: location.pathname,
        search: location.search,
        path: `${location.pathname}${location.search}`,
      }

      if (!this.blockHistoryListener) {
        this.incorporate(this.location.path, null, true)
      }

      this.blockHistoryListener = false
    })

    /* eslint-disable no-underscore-dangle */
    window.__BEIMO_REGISTER_PAGE = (name, load) => {
      this.entries[name] = load()
      if (this.onRegisterCallbacks[name]) {
        this.onRegisterCallbacks[name] = this.onRegisterCallbacks[name].filter(fn => {
          fn(this.entries[name])
          return false
        })
      }
    }

    if (window.__BEIMO_REGISTERED_PAGES) {
      window.__BEIMO_REGISTERED_PAGES.forEach(arr => window.__BEIMO_REGISTER_PAGE.apply(this, arr))
      delete window.__BEIMO_REGISTERED_PAGES
    }

    if (module.hot) {
      window.__BEIMO_HOT_UPDATE = (name, component) => {
        if (this.entries[name]) {
          this.entries[name] = component
          this.incorporate(this.location.path, null, true)
        }
      }

      window.__BEIMO_HOT_UPDATE_PAGES = ({ routes, pages }) => {
        this.routes = routes
        this.pages = pages
        this.incorporate(this.location.path, null, true)
      }
    }
  }

  isValidPage(page) {
    return page !== '_document' && (this.pages.includes(page) || page === '_error')
  }

  requirePage(page) {
    if (this.entries[page]) {
      return this.entries[page]
    }

    if (!this.isValidPage(page)) {
      throw new PageNotFoundError()
    }

    return new Promise(resolve => {
      if (!document.getElementById(`__BEIMO_PAGE__/${page}`)) {
        const script = document.createElement('script')
        script.src = `/_beimo_/${process.env.BUILD_ID}/pages/${page}.js`
        document.head.appendChild(script)
      }

      return this.onRegister(page, resolve)
    })
  }

  onRegister(page, callback) {
    if (!this.onRegisterCallbacks[page]) {
      this.onRegisterCallbacks[page] = []
    }

    this.onRegisterCallbacks[page].push(callback)
  }

  onLoad(fn) {
    this.handleLoad = fn
  }

  matchPath(path) {
    let match
    const route = this.routes.find(r => {
      match = matchPath(path, r.matcher)

      return match
    })

    return { route, match }
  }

  async incorporate(to, action = 'push', force = false) {
    if (action) {
      // Block history listener so incorporate wont be called twice
      this.blockHistoryListener = true
    }

    const { route, match } = this.matchPath(to)
    const location = buildLocation(to)

    if (!force && location.path === this.location.path && route && this.page === route.page) {
      return
    }

    this.location = location

    try {
      if (!match) {
        throw new PageNotFoundError()
      }

      this.page = route.page
      await this.handleLoad(route, match)
    } catch (error) {
      await this.handleLoad(
        '_error',
        matchPath(to),
        error,
      )
    }

    if (action) {
      this.history[action](to)
    }
  }
}

export default new Router()
