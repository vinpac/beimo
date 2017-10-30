import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { Switch, matchPath } from 'react-router-dom'
import Page from '../Page'
import { NotFoundPage } from '../router'
import { mapPages } from '../utils'

export default class Beimo {
  constructor({
    pages = [],
    assets = [],
    routes,
    component,
    resolvePageArgs,
    scripts,
    documentComponent,
    resolveAppState,
    resolveErrorPage,
  }) {
    this.pages = mapPages(pages)
    this.routes = routes
    this.assets = assets
    this.component = component
    this.documentComponent = documentComponent
    this.scripts = scripts
    this.resolvePageArgs = resolvePageArgs || (args => args)
    this.resolveAppState = resolveAppState || (args => args)
    this.resolveErrorPage = resolveErrorPage
  }

  configure({
    pages,
    routes,
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

    if (routes !== undefined) {
      this.routes = routes
    }
  }

  async render(req, res, next) {
    const { pages, resolveErrorPage, documentComponent: Document } = this
    let response = {}
    let pageError
    let pageErrorComponent

    const pagesProps = {}
    const promises = []
    let miss = true

    for (let i = 0; i < pages.length; i += 1) {
      const match = matchPath(req.path, pages[i])

      if (match) {
        miss = false
        if (pages[i].getInitialProps) {
          pagesProps[pages[i].id] = {}

          const yieldProps = props => {
            pagesProps[pages[i].id] = props
          }

          try {
            const promise = pages[i].getInitialProps(
              this.resolvePageArgs({
                ...match,
                query: req.query,
                yieldProps,
                response,
              }),
            )

            if (promise && promise instanceof Promise) {
              promise.then(props => props && yieldProps(props))
              promises.push(promise)
            } else if (promise) {
              yieldProps(promise)
            }
          } catch (error) {
            if (resolveErrorPage) {
              response = {}
              response.status = error instanceof NotFoundPage ? 404 : 500
              pagesProps[pages[i].id] = {}
              pageError = error
              pageErrorComponent = resolveErrorPage(error)

              if (pageErrorComponent) {
                if (pageErrorComponent.getInitialProps) {
                  const promise = pageErrorComponent.getInitialProps(
                    this.resolvePageArgs({
                      error,
                      yieldProps,
                      response,
                    }),
                  )

                  if (promise instanceof Promise) {
                    promise.then(props => props && yieldProps(props))
                    promises.push(promise)
                  } else if (promise) {
                    yieldProps(promise)
                  }
                }
              }
            }

            if (!pageErrorComponent) {
              throw error
            }
          }
        }

        // break for now
        break
      }
    }

    // Checks if theres a page with no path
    if (miss && !pages.some(page => !page.path)) {
      next()
      return
    }

    await Promise.all(promises)

    const children = (
      <Switch>
        {pages.map((page, i) => (
          <Page
            key={i} //eslint-disable-line
            path={page.path}
            exact={page.exact}
            component={page}
            initialProps={pagesProps[page.id]}
            errorComponent={pageErrorComponent}
            error={pageError}
          />
        ))}
      </Switch>
    )

    const body = ReactDOM.renderToString(
      <StaticRouter location={req.url} context={response}>
        {this.component ? <this.component context={response}>{children}</this.component> : children}
      </StaticRouter>,
    )

    const html = ReactDOM.renderToStaticMarkup(
      <Document
        {...response}
        scripts={this.scripts}
        appState={this.resolveAppState({
          pagesProps,
          pageError: pageError && {
            name: pageError.name,
            message: pageError.message,
            stack: pageError.stack,
          },
        })}
      >
        {body}
      </Document>,
    )

    res.status(response.status || 200)
    res.send(`<!doctype html>${html}`)
  }
}
