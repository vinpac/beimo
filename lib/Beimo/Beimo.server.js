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
  }) {
    this.pages = mapPages(pages)
    this.routes = routes
    this.assets = assets
    this.component = component
    this.documentComponent = documentComponent
    this.scripts = scripts
    this.resolvePageArgs = resolvePageArgs || (args => args)
    this.resolveAppState = resolveAppState || (args => args)
  }

  configure({ pages, routes, component, resolvePageArgs, documentComponent, resolveAppState }) {
    if (resolveAppState !== undefined) this.resolveAppState = resolveAppState
    if (documentComponent !== undefined) this.documentComponent = documentComponent
    if (pages !== undefined) this.pages = mapPages(pages)
    if (resolvePageArgs !== undefined) this.resolvePageArgs = resolvePageArgs
    if (component !== undefined) this.component = component
    if (routes !== undefined) {
      this.routes = routes
    }
  }

  async render(req, res, next) {
    const { pages, documentComponent: Document } = this
    const context = {}

    const pagesProps = {}
    const promises = []
    let miss = true

    for (let i = 0; i < pages.length; i += 1) {
      const match = matchPath(req.path, pages[i])

      if (match) {
        miss = false
        if (pages[i].getInitialProps) {
          pagesProps[pages[i].id] = {}

          try {
            const yieldProps = props => {
              pagesProps[pages[i].id] = props
            }

            const promise = pages[i].getInitialProps(
              this.resolvePageArgs({
                ...match,
                query: req.query,
                yieldProps,
                context,
              }),
            )

            if (promise && promise.then) {
              promise.then(props => props && yieldProps(props))
              promises.push(promise)
            } else if (promise) {
              yieldProps(promise)
            }
          } catch (error) {
            if (error instanceof NotFoundPage) {
              // Checks if theres a page with no path
              // const matchedPage = pages.find(page => !page.path)
              // if (!matchedPage) {
              //   next()
              //   return
              // }

              // Let the page with no path handle for now
              break
            }

            throw error
          }
        }

        // break for now
        break
      }
    }

    if (miss) {
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
          />
        ))}
      </Switch>
    )

    const body = ReactDOM.renderToString(
      <StaticRouter location={req.url} context={context}>
        {this.component ? <this.component context={context}>{children}</this.component> : children}
      </StaticRouter>,
    )

    const html = ReactDOM.renderToStaticMarkup(
      <Document {...context} scripts={this.scripts} appState={this.resolveAppState({ pagesProps })}>
        {body}
      </Document>,
    )

    res.status(context.status || 200)
    res.send(`<!doctype html>${html}`)
  }
}
