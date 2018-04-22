/* @flow */

import React from 'react'
import ReactDOM from 'react-dom/server'
import Helmet from 'react-helmet'
import { requirePage } from './require'
import StaticRouter, { PageNotFoundError } from '../modules/router'
import { buildLocation, matchPath, simulateMatch } from '../modules/router/core'
import type { Match } from '../modules/router/core'
import type { Route, RouterMap } from '../build/create-router-map'

type JSONableError = { ...Error, toJSON?: Function }
type Request = {
  url: string,
}
type Response = {
  statusCode: number,
  setHeader: Function,
  end: Function,
  write: Function,
}
type AppPage = {
  mapGetInialPropsArgs: ?Function,
  getContext: ?Function,
  getSharedState: ?Function,
}
type AppState = {
  route: {
    id?: string,
    initialProps: {},
    page: string,
    error: ?JSONableError,
  },
}

class Beimo {
  name = 'server'
  routes: Route[]
  pages: string[]
  buildId: string
  assetPath: string
  staticDir: string
  app: ?AppPage

  constructor(map: RouterMap, buildId: string, staticDir: string) {
    this.routes = map.routes
    this.pages = map.pages
    this.buildId = buildId
    this.assetPath = `/_beimo_/${buildId}`
    this.staticDir = staticDir
  }

  ensurePage = (page: string) => {
    if (page !== '_error' && !this.pages.includes(page)) {
      throw new PageNotFoundError(`${page} is not a valid page`)
    }
  }

  async prepare(): Promise<void> {
    let server
    if (__DEV__) {
      // Dev server will automatically load pages and routes
      // eslint-disable-next-line no-undef
      server = await __non_webpack_require__(process.env.CREATE_DEV_SERVER_PATH).default(this)
    }

    try {
      this.app = requirePage('_app')
    } catch (error) {
      if (!(error instanceof PageNotFoundError)) {
        throw error
      }
    }

    return server
  }

  matchPath(url: string) {
    let match
    const matchedRoute = this.routes.find(route => {
      match = matchPath(url, route.matcher)
      return match
    })

    return { route: matchedRoute || null, match }
  }

  handle = async (req: Request, res: Response, error: JSONableError) => {
    if (error) {
      return this.renderError(error, req, res)
    }

    try {
      const { route, match } = this.matchPath(req.url)
      if (!route) {
        throw new PageNotFoundError()
      }

      return await this.render(route.page, req, res, route, match)
    } catch (thrownError) {
      return this.renderError(thrownError, req, res)
    }
  }

  loadPageInitialProps = async (component: Function, baseParams: {}, context: {}) => {
    let initialProps = {}
    let renderCalled
    const render = props => {
      if (renderCalled) {
        throw new Error('Render called more than once')
      }

      renderCalled = true
      if (props) {
        initialProps = props
      }
    }

    if (component.getInitialProps) {
      let params = baseParams
      if (this.app && this.app.mapGetInialPropsArgs) {
        params = this.app.mapGetInialPropsArgs(params, context)
      }

      let loadedProps = component.getInitialProps({
        ...params,
        render,
      })

      if (loadedProps instanceof Promise) {
        loadedProps = await loadedProps
      }

      if (loadedProps) {
        initialProps = loadedProps
      }
    }

    return initialProps
  }

  renderError(error: JSONableError, req: Request, res: Response, route: ?Route, match: ?Match) {
    return this.render('_error', req, res, route, match, error)
  }

  render = async (
    page: string,
    req: Request,
    res: Response,
    route: ?Route,
    match: ?Match = route ? matchPath(req.url, route.matcher) : simulateMatch(req.url),
    error: ?JSONableError,
  ) => {
    if (__DEV__) {
      try {
        this.app = requirePage('_app')
      } catch (appError) {
        if (!(appError instanceof PageNotFoundError)) {
          throw appError
        }
      }
    }

    const location = buildLocation(req.url)
    const context = this.app && this.app.getContext ? this.app.getContext({ req, location }) : {}

    // Ensure page exists
    await this.ensurePage(page)

    // Components
    const Component = requirePage(page)
    const Document = requirePage('_document')
    const App = this.app

    const initialProps = await this.loadPageInitialProps(
      Component,
      {
        ...match,
        req,
        res,
        error,
        props: (route && route.props) || {},
      },
      context,
    )

    const body = ReactDOM.renderToString(
      <StaticRouter location={location}>
        {typeof App === 'function' ? (
          <App page={page} context={context} location={location}>
            <Component {...(route ? route.props : undefined)} error={error} {...initialProps} />
          </App>
        ) : (
          <Component {...(route ? route.props : undefined)} error={error} {...initialProps} />
        )}
      </StaticRouter>,
    )

    let appState: AppState = {
      route: {
        initialProps,
        page,
        error:
          error && typeof error.toJSON === 'function'
            ? error.toJSON()
            : error && {
                name: error.name,
                message: error.message,
                stack: __DEV__ ? error.stack : undefined,
              },
      },
    }

    if (route) {
      appState.route.id = route.id
    }

    if (this.app && this.app.getSharedState) {
      appState = this.app.getSharedState(appState, context)
    }

    const scripts = [
      __DEV__ && { src: `${this.assetPath}/manifest.js` },
      { src: `${this.assetPath}/vendor.js` },
      this.app && { id: '__BEIMO_PAGE__/_app', src: `${this.assetPath}/pages/_app.js` },
      { id: `__BEIMO_PAGE__/${page}`, src: `${this.assetPath}/pages/${page}.js` },
      { src: `${this.assetPath}/client.js` },
    ].filter(Boolean)

    const html = `<!doctype html>${ReactDOM.renderToStaticMarkup(
      <Document appState={appState} head={Helmet.renderStatic()} scripts={scripts}>
        {body}
      </Document>,
    )}`

    res.statusCode = res.statusCode || 200
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Length', Buffer.byteLength(html))
    res.write(html)
    res.end()
  }
}

export default Beimo
