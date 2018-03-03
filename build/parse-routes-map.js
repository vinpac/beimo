import fs from 'fs'
import yaml from 'js-yaml'
import { createMatcher as defaultCreateMatcher } from '../modules/router/utils'

const RE_PATH_PREFIX = /\((.+)\)/g
const isObject = item => Object.prototype.toString.call(item) === '[object Object]'

const createMatcher = (path, options, stringifyRegex) => {
  const matcher = defaultCreateMatcher(path, options)
  if (stringifyRegex) matcher.re = String(matcher.re)
  return matcher
}

export default function parseRoutesMap(
  map,
  pagePrefix = '',
  defaultPathPrefix = '',
  stringifyRegex = false,
) {
  const routes = []

  Object.keys(map).forEach(key => {
    let pathPrefix = defaultPathPrefix
    let page = `${pagePrefix}${key}`
    let addSlash = true

    if (key.includes('(')) {
      if (!key.includes(')')) {
        throw new Error(`Unclosed paren at pagesMap['${key}']`)
      }

      page = `${key.replace(RE_PATH_PREFIX, (match, prefix) => {
        pathPrefix += prefix
        return ''
      })}`

      addSlash = !!page
      page = `${pagePrefix}${page}`
    }

    if (isObject(map[key])) {
      routes.push(...parseRoutesMap(
        map[key],
        `${page}${addSlash ? '/' : ''}`,
        pathPrefix,
        stringifyRegex,
      ))
      return
    }

    if (page) {
      if (Array.isArray(map[key])) {
        map[key].forEach(child => {
          if (isObject(child)) {
            Object.keys(child).forEach(childKey => {
              routes.push({
                page,
                matcher: createMatcher(`${pathPrefix}${childKey}`, { exact: true }, stringifyRegex),
                path: `${pathPrefix}${childKey}`,
                props: child[childKey],
              })
            })
            return
          }

          routes.push({
            page,
            matcher: createMatcher(`${pathPrefix}${child}`, { exact: true }, stringifyRegex),
            path: `${pathPrefix}${child}`,
          })
        })
      } else {
        routes.push({
          page,
          matcher: createMatcher(`${pathPrefix}${map[key] || ''}`, { exact: true }, stringifyRegex),
          path: `${pathPrefix}${map[key] || ''}`,
        })
      }
    }
  })

  return routes
}

export function extractPagesFromRoutes(routes) {
  const pages = []
  routes.forEach(route => {
    if (!pages.includes(route.page)) {
      pages.push(route.page)
    }
  })

  return pages
}

export function load(filepath) {
  const map = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'))
  return parseRoutesMap(map, '', '', false)
}

export function loadAsync(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (error, source) => {
      if (error) {
        reject(error)
        return
      }

      const map = yaml.safeLoad(source)
      resolve(parseRoutesMap(map, '', '', false))
    })
  })
}
