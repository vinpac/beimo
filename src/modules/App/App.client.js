import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch } from 'react-router-dom'
import Page from '../Router/Page'
import { mapPages, isPage } from '../Router'

export default class App {
  constructor({ pages = [], resolveErrorPage, component, resolvePageArgs }) {
    this.pages = mapPages(pages)
    this.component = component
    this.resolvePageArgs = resolvePageArgs || (args => args)
    this.resolveErrorPage = resolveErrorPage
    this.dynamicImports = {}
  }

  configure({ pages, component, resolvePageArgs, resolveErrorPage }) {
    if (pages !== undefined) this.pages = mapPages(pages)
    if (resolvePageArgs !== undefined) this.resolvePageArgs = resolvePageArgs
    if (component !== undefined) this.component = component
    if (resolveErrorPage !== undefined) this.resolveErrorPage = resolveErrorPage
  }

  // eslint-disable-next-line
  handle() {
    throw new Error('handle is a server only method. Use hydrate instead.')
  }

  async hydrate(element) {
    const { page: { error } } = window.APP_STATE

    if (error) {
      const errorPage = this.resolveErrorPage(error)

      if (isPage(errorPage)) {
        errorPage.component = await errorPage.load().then(({ default: component }) => component)
      }
    } else {
      const page = this.pages.find(p => p.id === window.APP_STATE.page.id)

      if (page) {
        // Load current page component
        page.component = await page.load().then(({ default: component }) => component)
      }
    }

    this.appInstance = ReactDOM.hydrate(this.render(), element)
  }

  dynamicLoad = (key, fn) => {
    if (!this.dynamicImports[key]) {
      this.dynamicImports[key] = fn()
    }

    return this.dynamicImports[key]
  }

  render() {
    const { pages } = this

    const children = (
      <Switch>
        {pages.map((page, i) => (
          <Page
            key={i} //eslint-disable-line
            {...page}
            resolveArgs={this.resolvePageArgs}
            resolveErrorPage={this.resolveErrorPage}
            dynamicLoad={this.dynamicLoad}
          />
        ))}
      </Switch>
    )

    return (
      <BrowserRouter>
        {this.component ? <this.component>{children}</this.component> : children}
      </BrowserRouter>
    )
  }
}
