import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Switch } from 'react-router-dom'
import Page from '../Page'
import { mapPages } from '../utils'

export default class App {
  constructor({ pages = [], assets, route, component, resolvePageArgs }) {
    this.pages = mapPages(pages)
    this.route = route
    this.assets = assets
    this.component = component
    this.resolvePageArgs = resolvePageArgs || (args => args)
  }

  configure({ pages, component, resolvePageArgs }) {
    if (pages !== undefined) this.pages = mapPages(pages)
    if (resolvePageArgs !== undefined) this.resolvePageArgs = resolvePageArgs
    if (component !== undefined) this.component = component
  }

  // eslint-disable-next-line
  handle() {
    throw new Error('handle is a server only method. Use hydrate instead.')
  }

  hydrate(element) {
    this.instance = ReactDOM.hydrate(this.render(), element)
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
