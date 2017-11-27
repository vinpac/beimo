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
  return typeof potentialPage.page === 'string' && typeof potentialPage === 'object'
    && typeof potentialPage.load === 'function'
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

export function mapPages(pages) {
  const usedCount = {}
  return pages.map(page => {
    page.id = hash(`${page.displayName}${page.path}`)
    if (usedCount[page.id] > 0) {
      page.id += `-${usedCount[page.id]}`
      usedCount[page.id] += 1
    } else {
      usedCount[page.id] = 1
    }

    page.name = page.page
    page.exact = page.path && page.exact !== false

    if (page.miss) {
      page.path = undefined
    }

    return page
  })
}

export const Wrap = ({ children }) => children
