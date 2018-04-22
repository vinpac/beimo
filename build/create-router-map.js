/* @flow */
import isObject from 'is-plain-object'
import { createMatcher } from '../modules/router/core'
import type { Matcher } from '../modules/router'

type BaseRoute = { page: string, matcher: Matcher, props?: ?{} }

export type Route = {
  page: string,
  matcher: Matcher,
  props?: ?{},
  id: string,
}

export type RouterMap = {
  routes: Route[],
  pages: string[],
}

function mapToRoutes(map: {}, pagePrefix: string = '', pathPrefix: string = ''): BaseRoute[] {
  const routes: BaseRoute[] = []

  Object.keys(map).forEach(key => {
    let page: string = `${pagePrefix}${key}`
    const value: string | {} | Array<string | {}> = map[key]

    if (typeof value === 'string') {
      routes.push({ page, matcher: createMatcher(`${pathPrefix}${value}`) })
      return
    }

    const parenIndex = key.indexOf('(')
    if (parenIndex !== -1 && key[key.length - 1] !== ')') {
      throw new Error(`Expected ')' but found '${key[key.length - 1]}' at '${key}'`)
    }

    page = parenIndex === -1 ? key : key.substr(0, parenIndex)
    const pathPrefixJoined: string =
      parenIndex === -1
        ? pathPrefix
        : `${pathPrefix}${key.substr(parenIndex + 1, key.length - parenIndex - 2)}`

    if (isObject(value)) {
      // Here we know value is an object
      // @flow-supress-next-line
      routes.push(...mapToRoutes(value, `${pagePrefix}${page ? `${page}/` : ''}`, pathPrefixJoined))
      return
    }

    if (Array.isArray(value)) {
      // Here we know value is an array
      // @flow-supress-next-line
      value.forEach((child, i) => {
        if (typeof child === 'string') {
          routes.push({ page, matcher: createMatcher(`${pathPrefixJoined}${child}`) })
          return
        }

        if (isObject(child)) {
          Object.keys(child).forEach(childKey => {
            if (!isObject(child[childKey])) {
              throw new Error(
                `Expected object but found ${typeof child[childKey]} at '${key}.${i}.${childKey}'`,
              )
            }

            routes.push({
              page,
              props: child[childKey],
              matcher: createMatcher(`${pathPrefixJoined}${childKey}`),
            })
          })
          return
        }

        throw new Error(`Expected string but found ${typeof child} at '${key}.${i}'`)
      })
      return
    }

    throw new Error(`Expected string but found ${typeof value} at '${key}'`)
  })

  return routes
}

export default function createRouterMap(map: {}): RouterMap {
  const routes = mapToRoutes(map)
  const pages = []

  routes.forEach(route => {
    if (pages.indexOf(route.page === -1)) {
      pages.push(route.page)
    }
  })

  return {
    routes: routes.map((route, i) => ({ ...route, id: String(i) })),
    pages,
  }
}
