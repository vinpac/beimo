import path from 'path'
import send from 'send'
import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'
import Helmet from 'react-helmet'
import { Switch, matchPath } from 'react-router-dom'
import Page from '../Router/Page'
import { NotFoundPage, mapPages } from '../Router'

// eslint-disable-next-line
import { getStyles } from '!modular-style-loader/dist/store'

export default class App {
  constructor({
    pages = [],
    component,
    resolvePageArgs,
    assets,
    styles,
    documentComponent,
    resolveAppState,
    resolveErrorPage,
  }) {
    this.pages = mapPages(pages)
    this.assets = assets
    this.styles = styles || []
    this.component = component
    this.documentComponent = documentComponent
    this.resolvePageArgs = resolvePageArgs || (args => args)
    this.resolveAppState = resolveAppState || (args => args)
    this.resolveErrorPage = resolveErrorPage
    this.static = path.join(process.env.DIST_PATH, process.env.STATIC_DIR)
  }

  configure({
    pages,
    component,
    resolvePageArgs,
    documentComponent,
    resolveAppState,
    resolveErrorPage,
  }) {
    if (resolveAppState !== undefined) this.resolveAppState = resolveAppState
    if (documentComponent !== undefined) this.documentComponent = documentComponent
    if (pages !== undefined) this.pages = mapPages(pages)
    if (resolvePageArgs !== undefined) this.resolvePageArgs = resolvePageArgs
    if (resolveErrorPage !== undefined) this.resolveErrorPage = resolveErrorPage
    if (component !== undefined) this.component = component
  }

  // eslint-disable-next-line
  loadPage(page, match, response, query, error) {
    let pageProps = {}

    const fn = async ({ default: component }) => {
      if (component.getInitialProps) {
        const yieldProps = props => {
          pageProps = props
        }

        pageProps = await component.getInitialProps(
          this.resolvePageArgs({
            ...match,
            query: query || {},
            yieldProps,
            response,
            error,
          }),
        )
      }

      // Handles a component
      return { props: pageProps, component }
    }

    if (page.load && typeof page === 'object' && typeof page.page === 'string') {
      return page.load()
        .then(fn)
        .then(res => ({ ...res, script: this.assets[`pages/${page.page}`].js }))
    }

    return fn({ default: page })
  }

  async render(req, res, query = req.query) {
    const { pages, resolveErrorPage, documentComponent: Document } = this

    let matchedPage
    let response = {}
    let pageError
    let pageErrorComponent
    const scripts = [
      this.assets.vendor.js,
      this.assets.client.js,
    ]

    try {
      let miss = true
      let promise
      pages.some(page => {
        const match = matchPath(req.path, page)
        if (match) {
          miss = false
          matchedPage = { page }

          if (page.miss) {
            miss = true
            throw new NotFoundPage()
          }

          promise = this.loadPage(page, match, response, query)
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
      response = { status: error.status || 500 }
      matchedPage = { page: matchedPage && matchedPage.page, props: {} }
      pageError = error
      const errorPage = resolveErrorPage && resolveErrorPage(error)

      if (!resolveErrorPage || !errorPage) {
        throw error
      }

      const loadResponse = await this.loadPage(
        errorPage,
        { url: req.url, path: req.path },
        response,
        query,
        error,
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
            )}
          />
        ))}
      </Switch>
    )

    const body = ReactDOM.renderToString(
      <StaticRouter location={req.url} context={response}>
        {this.component ? <this.component context={response}>{children}</this.component> : children}
      </StaticRouter>,
    )

    const styles = this.styles.concat(getStyles(__DEV__))

    const html = `<!doctype html>${
      ReactDOM.renderToStaticMarkup(
        <Document
          {...response}
          scripts={scripts}
          head={Helmet.renderStatic()}
          appState={this.resolveAppState({
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
          })}
          styles={styles}
        >
          {body}
        </Document>,
      )
    }`

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
