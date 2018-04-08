import React from 'react'
import ReactDOM from 'react-dom'
import BeimoComponent from './BeimoComponent'
import Router, { PageNotFoundError } from '../modules/router'

let app

export function render() {
  const { route, ...sharedState } = window.APP_STATE

  const renderedRoute = route.id ? Router.routes.find(r => r.id === route.id) : null
  return (
    <BeimoComponent
      app={app}
      route={renderedRoute || { page: route.page }}
      page={route.page}
      error={route.error}
      loadedProps={route.loadedProps}
      context={app && app.getContext ? app.getContext(sharedState) : {}}
    />
  )
}

export async function hydrate(element) {
  console.log(window.APP_STATE)
  await Router.requirePage(window.APP_STATE.route.page)
  if (document.getElementById('__BEIMO_PAGE__/_app')) {
    try {
      app = await Router.requirePage('_app')
    } catch (error) {
      if (!(error instanceof PageNotFoundError)) {
        throw error
      }
    }
  }

  ReactDOM.hydrate(render(), element)
}
