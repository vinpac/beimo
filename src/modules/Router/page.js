import { createMatcher } from 'beimo/router'

export default (name, chunkId, load, props = {}) => {

  // eslint-disable-next-line
  props.__BEIMO_PAGE__ = true

  if (props.component) {
    delete props.component
  }

  props.load = load
  props.name = name
  props.id = chunkId
  props.props = props.props || {}

  if (!props.as && props.path) {
    props.exact = !!(props.path && props.exact !== false)
    props.matcher = createMatcher(props.path, props)
  }

  return props
}

export const NOT_FOUND_PAGE = '@@router/NOT_FOUND_PAGE'
export const ERROR_PAGE = '@@router/ERROR_PAGE'
