const hash = require('string-hash')

const chunkCountMap = {}
module.exports = (chunkName, props) => {
  if (!chunkCountMap[chunkName]) {
    chunkCountMap[chunkName] = 0
  }

  props.id = String(hash(`${chunkName}${chunkCountMap[chunkName] || ''}`))
  chunkCountMap[chunkName] += 1

  props.chunkName = chunkName
  props.exact = !!(props.path && props.exact !== false)

  // eslint-disable-next-line
  props.__BEIMO_PAGE__ = true

  if (props.component) {
    delete props.component
  }

  return props
}
