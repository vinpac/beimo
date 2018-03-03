import queryString from 'query-string'
import pathToRegexp from 'path-to-regexp'

const splitURL = url => {
  const queryIndex = url.indexOf('?')
  return [
    `${queryIndex === -1 ? url : url.substr(0, queryIndex)}`,
    `${queryIndex === -1 ? '' : url.substr(queryIndex)}`,
  ]
}

export function matchPath(path, matcher) {
  const [pathname, search] = splitURL(path)
  const params = {}

  if (matcher) {
    const match = matcher.re.exec(pathname)

    if (!match) {
      return null
    }

    matcher.keys.forEach((key, i) => {
      params[key.name] = match[i + 1]
    })
  }

  return { path, pathname, params, query: queryString.parse(search) }
}

export function createMatcher(path, options) {
  const keys = []
  return {
    re: pathToRegexp(path, keys, options),
    keys,
  }
}

export function buildLocation(path) {
  const [pathname, search] = splitURL(path)

  return { path, pathname, search }
}
