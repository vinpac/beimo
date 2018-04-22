/* @flow */
import queryString from 'query-string'
import pathToRegexp from 'path-to-regexp'

export type Match = {
  path: string,
  query?: { [string]: any },
  params?: { [string]: string },
}

export type Matcher = {
  re: RegExp,
  keys: string[],
}

export type Location = { path: string, pathname: string, search: string }

export function simulateMatch(path: string): Match {
  const queryIndex = path.indexOf('?')
  return {
    path,
    params: {},
    query: queryString.parse(`${queryIndex === -1 ? '' : path.substr(queryIndex)}`),
  }
}

export function matchPath(path: string, matcher: Matcher): ?Match {
  const queryIndex = path.indexOf('?')
  const pathname = `${queryIndex === -1 ? path : path.substr(0, queryIndex)}`
  const match = matcher.re.exec(pathname)

  if (!match) {
    return null
  }

  const params = {}

  matcher.keys.forEach((key, i) => {
    params[key] = match[i + 1]
  })

  return {
    path,
    params,
    query: queryString.parse(`${queryIndex === -1 ? '' : path.substr(queryIndex)}`),
  }
}

export function createMatcher(path: string, options: ?{}): Matcher {
  const keys = []
  return {
    re: pathToRegexp(path, keys, options),
    keys: keys.map(key => key.name),
  }
}

export function buildLocation(path: string): Location {
  const queryIndex = path.indexOf('?')

  return {
    path,
    pathname: `${queryIndex === -1 ? path : path.substr(0, queryIndex)}`,
    search: `${queryIndex === -1 ? '' : path.substr(queryIndex)}`,
  }
}
