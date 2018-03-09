import fs from 'fs'
import path from 'path'

export default function getRequireablePath(modulePath) {
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
    return path.join(modulePath, require(pathFound).main)
  }

  return pathFound
}
