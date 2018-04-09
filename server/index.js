import '@babel/polyfill'
import path from 'path'
import React from 'react'
import ReactDOM from 'react-dom/server'
import Helmet from 'react-helmet'
import { getStyles } from 'modular-style-loader/dist/store'
import Router, { PageNotFoundError } from '../modules/router'
import { buildLocation, matchPath } from '../modules/router/utils'
import { requirePage } from './require'
import routesMap from '__@@BEIMO_SOURCE__/pages/index.yml' // eslint-disable-line

// Page is a string
// Route is an object that has a page and more data of how rendering this page
class Beimo {
  constructor() {
    this.routes = routesMap.routes
    this.pages = routesMap.pages
    this.assetPath = `/_beimo_/${process.env.BUILD_ID}/`
    this.staticPath = path.resolve(__dirname, process.env.REL_STATIC_DIR)
  }

  ensurePage = page => {
    if (page !== '_error' && !this.pages.includes(page)) {
      throw new PageNotFoundError(`${page} is not a valid page`)
    }
  }

  async start(listen) {
    let server
    if (__DEV__) {
      // Dev server will automatically load pages and routes
      // eslint-disable-next-line no-undef
      server = await __non_webpack_require__(process.env.CREATE_DEV_SERVER_PATH).default(
        this,
        listen,
      )
    }

    try {
      this.app = requirePage('_app')
    } catch (error) {
      if (!(error instanceof PageNotFoundError)) {
        throw error
      }
    }

    if (!__DEV__) {
      server = listen()
    }

    return server
  }

  // TODO: Serve static files on production
  serve = () => {
    throw new Error("It doesn't do anything now")
  }

  matchPath(pathname) {
    let match
    const matchedRoute = this.routes.find(route => {
      match = matchPath(pathname, route.matcher)
      return match
    })

    return { route: matchedRoute, match }
  }

  handle = async (req, res, error) => {
    if (error) {
      return this.renderError(error, req, res)
    }

    try {
      const { route, match } = this.matchPath(req.url)
      if (!route) {
        throw new PageNotFoundError()
      }

      return await this.render(route, req, res, match)
    } catch (renderError) {
      return this.renderError(renderError, req, res)
    }
  }

  loadPageInitialProps = async (component, match, context, error, props) => {
    const response = {}
    let pageProps = {}

    const yieldProps = newProps => {
      pageProps = newProps
    }
    const send = overrides => Object.assign(response, overrides)

    if (component.getInitialProps) {
      let params = {
        ...match,
        props,
        yieldProps,
        send,
        error,
      }

      if (this.app && this.app.getLoadPropsParams) {
        params = this.app.getLoadPropsParams(params, context)
      }

      const promiseCandidate = component.getInitialProps(params)

      let possibleNewProps
      if (promiseCandidate instanceof Promise) {
        possibleNewProps = await promiseCandidate
      } else {
        possibleNewProps = promiseCandidate
      }

      pageProps = possibleNewProps || pageProps
    }

    return [pageProps, response]
  }

  renderError(error, req, res, match) {
    return this.render('_error', req, res, match, error)
  }

  render = async (pageOrRoute, req, res, match, error) => {
    if (__DEV__) {
      try {
        this.app = requirePage('_app')
      } catch (appError) {
        if (!(appError instanceof PageNotFoundError)) {
          throw appError
        }
      }
    }

    const route = typeof pageOrRoute === 'string' ? { page: pageOrRoute } : pageOrRoute
    const location = buildLocation(req.url)
    const context = this.app && this.app.getContext ? this.app.getContext({ req, location }) : {}

    // Ensure page exists
    await this.ensurePage(route.page)

    const Component = requirePage(route.page)
    const Document = requirePage('_document')

    const [loadedProps, response] = await this.loadPageInitialProps(
      Component,
      match || matchPath(req.url, route.matcher),
      context,
      error,
      route.props || {},
    )

    if (response.redirect) {
      // Express.js
      if (res.redirect) {
        res.redirect(response.redirect)
      } else {
        res.statusCode = response.status || 302
        res.writeHead(res.statusCode, { Location: response.redirect })
        res.end()
      }
      return
    }

    // Define response status
    response.status = error ? response.status || error.status || 500 : 200

    const body = ReactDOM.renderToString(
      <Router.StaticRouter location={location}>
        {this.app ? (
          <this.app context={context} location={location}>
            <Component {...route.props} error={error} {...loadedProps} />
          </this.app>
        ) : (
          <Component {...route.props} error={error} {...loadedProps} />
        )}
      </Router.StaticRouter>,
    )

    let appState = {
      route: {
        loadedProps,
        id: route.id,
        page: route.page,
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

    if (this.app && this.app.getSharedState) {
      appState = this.app.getSharedState(appState, context)
    }

    const scripts = [
      { src: `${this.assetPath}vendor.js` },
      this.app && { id: '__BEIMO_PAGE__/_app', src: `${this.assetPath}pages/_app.js` },
      { id: `__BEIMO_PAGE__/${route.page}`, src: `${this.assetPath}pages/${route.page}.js` },
      { src: `${this.assetPath}client.js` },
    ].filter(script => script)
    const styles = __DEV__
      ? [getStyles(true)]
      : [getStyles(false), { url: `${this.assetPath}style.css` }]

    const html = `<!doctype html>${ReactDOM.renderToStaticMarkup(
      <Document appState={appState} head={Helmet.renderStatic()} scripts={scripts} styles={styles}>
        {body}
      </Document>,
    )}`

    res.statusCode = response.status || 200
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Length', Buffer.byteLength(html))
    res.write(html)
    res.end()
  }
}

export default new Beimo()
