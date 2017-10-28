import path from 'path'
import pkg from '../package.json'
import { copyDir, copyFile, makeDir, writeFile } from './fs'

async function copy({ distPath, basePath, staticDir, appPackage = {}, has }) {
  await makeDir('build')

  const baseDependencies = { 'string-hash': pkg.dependencies['string-hash'] }

  if (!has.server) {
    baseDependencies.express = pkg.dependencies.express
    baseDependencies['body-parser'] = pkg.dependencies['body-parser']
  }

  await Promise.all([
    writeFile(path.join(distPath, 'package.json'), JSON.stringify({
      ...appPackage,
      dependencies: {
        ...baseDependencies,
        ...appPackage.dependencies,
      },
    }, null, 2)),
    // copyFile(path.join(basePath, 'LICENSE.txt'), path.join(distPath, 'LICENSE.txt')),
    // copyDir(path.join(basePath, staticDir), path.join(distPath, staticDir)),
  ])
}

export default copy
