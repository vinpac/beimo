import hash from 'string-hash'

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

export function parsePagesConfig(pagesConfig) {
  if (Array.isArray(pagesConfig)) {
    return { pages: pagesConfig }
  }

  const { pages, missPage, resolveErrorPage } = pagesConfig

  if (missPage) {
    missPage.path = undefined
  }

  return {
    pages: missPage ? pages.concat([missPage]) : pages,
    resolveErrorPage: missPage
      ? createErrorPageResolver(missPage, resolveErrorPage)
      : resolveErrorPage,
  }
}

export const Wrap = ({ children }) => children
