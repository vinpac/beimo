import queryString from 'query-string'
import pathToRegexp from 'path-to-regexp'

export class PageError extends Error {
  constructor(message, status) {
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

export class NotFound extends PageError {
  constructor(message) {
    super(message, 404)

    this.name = 'NotFound'
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

const urlToPathname = url => {
  const queryIndex = url.indexOf('?')
  return `${queryIndex === -1 ? url : url.substr(0, queryIndex)}`
}

export function extractPathData(str) {
  const queryIndex = str.indexOf('?')
  return {
    url: str,
    params: {},
    query: queryIndex === -1 ? {} : queryString.parse(str.substr(queryIndex)),
  }
}

export function matchPage(url, page) {
  if (!page.matcher) {
    return null
  }

  const match = page.matcher.re.exec(urlToPathname(url), -1)

  if (!match) {
    return null
  }

  const result = extractPathData(url)

  page.matcher.keys.forEach((key, i) => {
    result.params[key.name] = match[i + 1]
  })

  return result
}

export function createMatcher(path, options) {
  const keys = []
  return {
    re: pathToRegexp(path, keys, options),
    keys,
  }
}

export function buildLocation(path) {
  const [pathname, search] = path.split('?')

  return { path, pathname, search: search || '' }
}

export function matchPath(path, pages) {
  let match
  const page = pages.find(p => {
    match = matchPage(path, p)

    return match
  })

  return [page, path, match]
}

export { default } from './SharedRouter'
