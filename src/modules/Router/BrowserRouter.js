import createBrowserHistory from 'history/createBrowserHistory'
import { NOT_FOUND_PAGE, ERROR_PAGE } from 'beimo/page'
import { NotFound, matchPath, extractPathData, buildLocation } from '.'


class Router {
  constructor() {
    this.history = createBrowserHistory()
    this.location = {
      pathname: this.history.location.pathname,
      search: this.history.location.search,
      path: `${this.history.location.pathname}${this.history.location.search}`,
    }

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
  }

  set __pages(pages) {
    if (this.pages && module.hot) {
      this.pages = pages
      this.incorporate(this.location.path, null, true)
    }

    this.pages = pages
  }

  setLoadHandler(fn) {
    this.handleLoad = fn
  }

  getErrorPage(error) {
    const isNotFoundError = error instanceof NotFound
    let errorPage

    this.pages.some(page => {
      if (isNotFoundError && page.as === NOT_FOUND_PAGE) {
        errorPage = page
        return true
      }

      if (!errorPage && page.as === ERROR_PAGE) {
        errorPage = page

        if (!isNotFoundError) {
          return true
        }
      }

      return false
    })

    return errorPage
  }

  async incorporate(to, action = 'push', force = false) {
    if (action) {
      // Block history listener so incorporate wont be called twice
      this.blockHistoryListener = true
    }

    const [page, path, match] = matchPath(to, this.pages)
    const location = buildLocation(path)

    if (!force && location.path === this.location.path && page && this.renderedPageId === page.id) {
      return
    }

    this.location = location

    try {
      if (!match) {
        throw new NotFound()
      }

      this.renderedPageId = page.id
      await this.handleLoad(page, match)
    } catch (error) {
      const errorPage = this.getErrorPage(error)
      await this.handleLoad(errorPage, extractPathData(path), error)
    }

    if (action) {
      this.history[action](path)
    }
  }
}

export default new Router()
