import fs from 'fs'
import path from 'path'
import { PageNotFoundError } from '../modules/router'

export function requirePage(page) {
  try {
    // eslint-disable-next-line no-undef
    const module = __non_webpack_require__(path.resolve(__dirname, 'pages', page))
    return module.default || module
  } catch (error) {
    if (error.message.startsWith('Cannot find module')) {
      throw new PageNotFoundError(page)
    }

    throw error
  }
}

export function getRequireablePath(modulePath) {
  const paths = []

  if (/\..+$/.test(modulePath)) {
    paths.push(modulePath)
  } else {
    paths.push(
      `${modulePath}.js`,
      path.join(modulePath, 'index.js'),
      path.join(modulePath, 'package.json'),
    )
  }

  const pathFound = paths.find(possiblePath => fs.existsSync(possiblePath))

  if (pathFound && pathFound.endsWith('package.json')) {
    return path.join(modulePath, __non_webpack_require__(pathFound).main)
  }

  return pathFound
}

