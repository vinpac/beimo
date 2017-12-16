const hash = require('string-hash')

module.exports = (chunkName, props) => {
  props.id = String(hash(`${chunkName}${props.path}${props.exact ? '1' : '0'}`))

  props.chunkName = chunkName
  props.exact = !!(props.path && props.exact !== false)

  // eslint-disable-next-line
  props.__BEIMO_PAGE__ = true

  if (props.component) {
    delete props.component
  }

  return props
}
