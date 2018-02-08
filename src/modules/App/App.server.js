import React from 'react'
import path from 'path'
import ReactDOM from 'react-dom/server'
import Helmet from 'react-helmet'
import Router, { buildLocation, matchPage, NotFound, isPage } from '../Router'
import { ERROR_PAGE, NOT_FOUND_PAGE } from 'beimo/page'

// eslint-disable-next-line
import { getStyles } from '!modular-style-loader/dist/store'

const allowedOverrides = [
  'pages',
  'assets',
  'component',
  'getContext',
  'getLoadPropsParams',
  'getSharedState',
]
class App {
  constructor(pages, assets, styles, documentComponent) {
    this.pages = pages
    this.assets = assets
    this.styles = styles
    this.documentComponent = documentComponent

    // Default getters
    this.getSharedState = a => a
    this.getLoadPropsParams = a => a
  }

  configure(overrides) {
    Object.keys(overrides).forEach(key => {
      if (allowedOverrides.includes(key)) {
        this[key] = overrides[key]
      }
    })
  }

  getPageByName(name) {
    return this.pages.find(page => name === page.name)
  }

  async loadPageInitialProps(page, component, match, context, error) {
    const response = {}
    let pageProps = {}

    const yieldProps = newProps => {
      pageProps = newProps
    }
    const send = overrides => Object.assign(response, overrides)

    if (component.getInitialProps) {
      const promiseCandidate = component.getInitialProps(
        this.getLoadPropsParams(
          {
            ...match,
            props: page.props,
            yieldProps,
            send,
            error,
          },
          context,
        ),
      )

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

  async render(possiblePage, req, res, match, error) {
    if (!possiblePage) {
      throw new Error(`Page must not be ${typeof possiblePage} in render.`)
    }

    const { documentComponent: Document } = this
    const page = isPage(possiblePage) ? possiblePage : this.getPageByName(possiblePage)
    const Component = await page.load().then(module => module.default || module)
    const context = this.getContext ? this.getContext({ req, page, isServer: true }) : {}
    const [loadedProps, response] = await this.loadPageInitialProps(
      page,
      Component,
      match || matchPage(req.path, page),
      context,
      error,
    )
    response.status = error ? response.status || error.status || 500 : 200
    const location = buildLocation(req.path)

    if ((Component === undefined || !this.assets[`pages/${page.id}`]) && __DEV__) {
      // eslint-disable-next-line
      this.__beimo_devForceServerReload__()
      throw new Error('Components is undefined. Reload the page to see changes.')
    }

    const body = ReactDOM.renderToString(
      <Router.StaticRouter location={location} response={response}>
        {this.component ? (
          <this.component location={location} context={context}>
            <Component {...page.props} error={error} {...loadedProps} />
          </this.component>
        ) : (
          <Component {...page.props} error={error} {...loadedProps} />
        )}
      </Router.StaticRouter>,
    )

    const sharedAppState = this.getSharedState(
      {
        page: {
          id: page.id,
          props: loadedProps,
          error:
            error && typeof error.toJSON === 'function'
              ? error.toJSON()
              : error && {
                name: error.name,
                message: error.message,
                stack: __DEV__ && error.stack,
              },
        },
      },
      context,
    )

    const styles = this.styles.concat(getStyles(__DEV__))
    const scripts = [
      this.assets.vendor.js,
      __DEV__ ? path.resolve(this.assets.client.js, '..', 'client.js') : this.assets.client.js,
      this.assets[`pages/${page.id}`].js,
    ]

    const html = `<!doctype html>${ReactDOM.renderToStaticMarkup(
      <Document
        {...response}
        scripts={scripts}
        head={Helmet.renderStatic()}
        appState={sharedAppState}
        styles={styles}
      >
        {body}
      </Document>,
    )}`

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

    res.statusCode = response.status || 200
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Content-Length', Buffer.byteLength(html))
    res.write(html)
    res.end()
  }

  renderError(error, req, res) {
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

    this.render(errorPage, req, res, undefined, error)
  }

  async handle(...args) {
    if (args.length > 2) {
      // Assume first argument is an error

      await this.renderError(args[0], args[1], args[2])
      return
    }

    const [req, res] = args
    try {
      const [page, match] = this.findPageByRequest(req)
      if (!page) {
        throw new NotFound()
      }
      await this.render(page, req, res, match)
    } catch (error) {
      await this.renderError(error, req, res)
    }
  }

  findPageByRequest(req) {
    let match
    const matchedPage = this.pages.find(page => {
      match = matchPage(req.url, page)
      return match
    })

    return [matchedPage, match]
  }
}

export default App
