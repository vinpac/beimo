import hash from 'string-hash'
import { Link, NavLink, Route, Redirect, Switch } from 'react-router-dom'

export class PageError extends Error {
  constructor(message: ?string, status: ?number) {
    super(message)

    this.name = 'PageError'
    this.status = status || 500
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      stack: __DEV__ ? this.stack : undefined,
    }
  }
}

export class NotFoundPage extends PageError {
  constructor(message: ?string) {
    super(message, 404)

    this.name = 'NotFoundPage'
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      stack: __DEV__ ? this.stack : undefined,
    }
  }
}

export function isPage(potentialPage) {
  // eslint-disable-next-line
  return potentialPage.__BEIMO_PAGE__ && typeof potentialPage.load === 'function'
}

export function createErrorPageResolver(missPage, fn) {
  return error => {
    if (missPage && error.name === 'NotFoundPage') {
      return missPage
    }

    return fn ? fn(error) : undefined
  }
}

export function parsePages(pages) {
  let missPage
  let errorPage

  pages.some(page => {
    if (page.useAs === 'error') {
      errorPage = page
    }

    missPage = errorPage

    return missPage && errorPage
  })

  return {
    pages: pages.filter(page => page.useAs !== 'error'),
    getErrorPage: createErrorPageResolver(
      pages.find(page => page.useAs === 'miss'),
      () => errorPage,
    ),
  }
}

export { Link, NavLink, Route, Redirect, Switch }
