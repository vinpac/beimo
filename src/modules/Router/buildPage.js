module.exports = (chunkName, load, id, props) => {
  if (typeof props !== 'object') {
    throw new Error('Second argument of page must be an object')
  }
  props.chunkName = chunkName
  props.exact = !!(props.path && props.exact !== false)

  // eslint-disable-next-line
  props.__BEIMO_PAGE__ = true

  if (props.component) {
    delete props.component
  }

  props.load = load
  props.id = id

  return props
}
