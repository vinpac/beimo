import path from 'path'
import send from 'send'
import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'
import Helmet from 'react-helmet'
import { Switch, matchPath } from 'react-router-dom'
import Page from '../Router/Page'
import { NotFoundPage, isPage } from '../Router'

// eslint-disable-next-line
import { getStyles } from '!modular-style-loader/dist/store'

const defaultPageArgsResolver = args => args
const defaultSharedStateResolver = ({ page }) => ({ page })
export default class App {
  constructor({
    pages = [],
    component,
    assets,
    styles,
    documentComponent,
    getInitialProps,
    getPageArgs,
    getSharedState,
    getErrorPage,
  }) {
    // Core
    this.pages = pages
    this.assets = assets
    this.styles = styles || []
    this.static = path.join(process.env.DIST_PATH, process.env.STATIC_DIR)

    // Components
    this.component = component
    this.documentComponent = documentComponent

    // Getters
    this.getComponentInitialProps = getInitialProps
    this.getPageArgs = getPageArgs || defaultPageArgsResolver
    this.getSharedState = getSharedState || defaultSharedStateResolver
    this.getErrorPage = getErrorPage
  }

  configure({
    assets,
    pages,
    component,
    documentComponent,
    getInitialProps,
    getPageArgs,
    getSharedState,
    getErrorPage,
  }) {
    // Core
    if (assets !== undefined) this.assets = assets
    if (pages !== undefined) this.pages = pages

    // Components
    if (component !== undefined) this.component = component
    if (documentComponent !== undefined) this.documentComponent = documentComponent

    // Getters
    if (getInitialProps !== undefined) this.getComponentInitialProps = getInitialProps
    if (getPageArgs !== undefined) this.getPageArgs = getPageArgs
    if (getSharedState !== undefined) this.getSharedState = getSharedState
    if (getErrorPage !== undefined) this.getErrorPage = getErrorPage
  }

  // eslint-disable-next-line
  loadPage(page, match, response, query, error, appComponentProps) {
    let pageProps = {}

    const fn = async ({ default: component }) => {
      if (component.getInitialProps) {
        const yieldProps = props => {
          pageProps = props
        }

        pageProps = await component.getInitialProps(
          this.getPageArgs({
            ...match,
            query: query || {},
            yieldProps,
            response,
            error,
            pageProps: page.pageProps,
          }, appComponentProps),
        )
      }

      // Handles a component
      return { props: pageProps, component }
    }

    if (isPage(page)) {
      return page.load()
        .then(fn)
        .then(res => ({ ...res, script: this.assets[page.chunkName].js }))
    }

    return fn({ default: page })
  }

  async render(req, res, query = req.query) {
    const { pages, getErrorPage, documentComponent: Document } = this

    let matchedPage
    let response = {}
    let pageError
    let pageErrorComponent
    const redirectFn = url => { response.url = url }
    response.redirect = redirectFn
    const scripts = [
      this.assets.vendor.js,
      this.assets.client.js,
    ]
    const appComponentProps = this.getComponentInitialProps
      ? this.getComponentInitialProps({ req })
      : {}

    try {
      let miss = true
      let promise
      pages.some(page => {
        const match = matchPath(req.path, page)
        if (match) {
          miss = false
          matchedPage = { page }

          if (page.use === 'miss') {
            miss = true
            throw new NotFoundPage()
          }

          promise = this.loadPage(page, match, response, query, undefined, appComponentProps)
        }

        return match
      })

      if (miss) {
        throw new NotFoundPage()
      }

      await promise.then(({ props, component, script }) => {
        matchedPage.props = props
        matchedPage.component = component
        scripts.push(script)
      })
    } catch (error) {
      response = { status: error.status || 500, redirect: redirectFn }
      matchedPage = { page: matchedPage && matchedPage.page, props: {} }
      pageError = error
      const errorPage = getErrorPage && getErrorPage(error)

      if (!getErrorPage || !errorPage) {
        throw error
      }

      const loadResponse = await this.loadPage(
        errorPage,
        { url: req.url, path: req.path },
        response,
        query,
        error,
        appComponentProps,
      )

      pageErrorComponent = loadResponse.component
      matchedPage.props = loadResponse.props

      if (loadResponse.script) {
        scripts.push(loadResponse.script)
      }
    }

    const children = (
      <Switch>
        {pages.map((page, i) => (
          <Page
            {...page}
            key={i} //eslint-disable-line
            initialProps={matchedPage.page === page ? matchedPage.props : undefined}
            error={pageError}
            errorComponent={pageErrorComponent}
            {...(matchedPage.page === page
              ? { component: matchedPage.component }
              : {}
            ) }
          />
        ))}
      </Switch>
    )

    const body = ReactDOM.renderToString(
      <StaticRouter location={req.url} context={response}>
        {this.component
          ? <this.component {...appComponentProps}>{children}</this.component>
          : children
        }
      </StaticRouter>,
    )

    const styles = this.styles.concat(getStyles(__DEV__))

    const appState = this.getSharedState({
      page: {
        id: matchedPage.page && matchedPage.page.id,
        props: matchedPage.props,
        error: pageError && typeof pageError.toJSON === 'function'
          ? pageError.toJSON()
          : pageError && {
            name: pageError.name,
            message: pageError.message,
            stack: pageError.stack,
          },
      },
    }, appComponentProps)

    const html = `<!doctype html>${
      ReactDOM.renderToStaticMarkup(
        <Document
          {...response}
          scripts={scripts}
          head={Helmet.renderStatic()}
          appState={appState}
          styles={styles}
        >
          {body}
        </Document>,
      )
      }`

    if (response.url) {
      // Express.js
      if (res.redirect) {
        res.redirect(response.url)
      } else {
        res.statusCode = response.status || 302
        res.writeHead(res.statusCode, { Location: response.url })
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

  // eslint-disable-next-line
  serveStatic(req, res, p) {
    return new Promise((resolve, reject) => {
      send(req, p)
        .on('directory', () => {
          // We don't allow directories to be read.
          const err = new Error('No directory access')
          err.code = 'ENOENT'
          reject(err)
        })
        .on('error', reject)
        .pipe(res)
        .on('finish', resolve)
    })
  }
}
