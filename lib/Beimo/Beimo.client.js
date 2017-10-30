import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch } from 'react-router-dom'
import Page from '../Page'
import { mapPages } from '../utils'

export default class Beimo {
  constructor({ pages = [], component, resolvePageArgs, resolveErrorPage }) {
    this.pages = mapPages(pages)
    this.component = component
    this.resolvePageArgs = resolvePageArgs || (args => args)
    this.resolveErrorPage = resolveErrorPage
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

  hydrate(element) {
    this.appInstance = ReactDOM.hydrate(this.render(), element)
  }

  render() {
    const { pages } = this

    const children = (
      <Switch>
        {pages.map((page, i) => (
          <Page
            key={i} //eslint-disable-line
            path={page.path}
            component={page}
            resolveArgs={this.resolvePageArgs}
            resolveErrorPage={this.resolveErrorPage}
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
