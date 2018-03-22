import stringHash from 'string-hash'
import { createMatcher } from 'beimo/router'

export const NOT_FOUND_PAGE = '@@router/NOT_FOUND_PAGE'
export const ERROR_PAGE = '@@router/ERROR_PAGE'

export default (name, chunk, load, path, props = {}) => {
  // eslint-disable-next-line
  const page = { __BEIMO_PAGE__: true }

  page.load = load
  page.chunk = chunk
  page.name = name
  page.id = String(stringHash(JSON.stringify({ chunk, path, props })))
  page.props = props

  if (path) {
    if (path === NOT_FOUND_PAGE || path === ERROR_PAGE) {
      page.as = path
    } else {
      page.exact = true
      page.matcher = createMatcher(path, { exact: true })
    }
  }

  return page
}
