import React from 'react'
import ReactDOM from 'react-dom'
import AppComponent from './AppComponent.client'
import Router from 'beimo/router'

const allowedOverrides = ['pages', 'component', 'getContext', 'getLoadPropsParams', 'getSharedState']
class App {
  constructor(pages) {
    this.pages = pages
    this.chunks = {}
    this.getLoadPropsParams = x => x
  }

  configure(overrides) {
    Object.keys(overrides).forEach(key => {
      if (allowedOverrides.includes(key)) {
        if (key === 'pages' && module.hot) {
          this[key] = overrides[key]

          if (this.instance) {
            this.chunks = {}
            // eslint-disable-next-line no-underscore-dangle
            Router.__pages = overrides[key]
          }
        } else {
          this[key] = overrides[key]
        }
      }
    })
  }

  requirePageModule = pageId => {
    if (this.chunks[pageId]) {
      return this.chunks[pageId]
    }

    const page = this.pages.find(p => p.id === pageId)
    if (!page) {
      return null
    }

    return page.load().then(module => {
      this.chunks[pageId] = module.default || module

      return this.chunks[pageId]
    })
  }

  async hydrate(element) {
    await this.requirePageModule(window.APP_STATE.page.id)

    /* eslint-disable no-underscore-dangle */
    Router.__pages = this.pages
    Router.renderedPageId = window.APP_STATE.page.id
    /* eslint-enable no-underscore-dangle */
    this.instance = ReactDOM.hydrate(this.render(), element)
  }

  render() {
    const { page: renderedPage, ...sharedState } = window.APP_STATE
    const defaultPage = this.pages.find(page => page.id === renderedPage.id)

    return (
      <AppComponent
        defaultPage={defaultPage}
        defaultPageProps={renderedPage.loadedProps}
        defaultPageError={renderedPage.error}
        component={this.component}
        context={this.getContext ? this.getContext(sharedState) : {}}
        getLoadPropsParams={this.getLoadPropsParams}
        requirePageModule={this.requirePageModule}
      />
    )
  }
}

export default App
