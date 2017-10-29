import fs from 'fs'
import path from 'path'
import pkg from '../package.json'
import { copyDir, copyFile, makeDir, writeFile } from './lib/fs'

async function copy({ distPath, basePath, files, staticDir, appPackage = {}, has }) {
  await makeDir(distPath)

  const baseDependencies = {
    'string-hash': pkg.dependencies['string-hash'],
    'source-map-support': pkg.dependencies['source-map-support'],
    'react-router': pkg.dependencies['react-router'],
    'react-router-dom': pkg.dependencies['react-router-dom'],
    'serialize-javascript': pkg.dependencies['serialize-javascript'],
  }

  if (!has.server) {
    baseDependencies.express = pkg.dependencies.express
    baseDependencies['body-parser'] = pkg.dependencies['body-parser']
  }

  const promises = [
    writeFile(path.join(distPath, 'package.json'), JSON.stringify({
      ...appPackage,
      dependencies: {
        ...baseDependencies,
        ...appPackage.dependencies,
      },
      scripts: {
        ...appPackage.scripts,
        start: 'node server.js',
      },
    }, null, 2)),
    copyDir(path.join(basePath, staticDir), path.join(distPath, staticDir)),
  ]

  files.forEach(filename => {
    const filePath = path.join(basePath, filename)
    if (fs.lstatSync(filePath).isDirectory()) {
      promises.push(copyDir(filePath, path.join(distPath, filename)))
    } else {
      promises.push(copyFile(filePath, path.join(distPath, filename)))
    }
  })


  await Promise.all(promises)
}

export default copy
