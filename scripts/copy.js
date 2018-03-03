import fs from 'fs'
import path from 'path'
import pkg from '../../package.json' // eslint-disable-line
import { copyDir, copyFile, makeDir, writeFile } from '../build/utils/fs'

async function copy({ distDir, baseDir, staticDir, overrideServer, appPackage = {} }) {
  await makeDir(distDir)

  const baseDependencies = {
    'source-map-support': pkg.dependencies['source-map-support'],
    'serialize-javascript': pkg.dependencies['serialize-javascript'],
  }

  if (!overrideServer) {
    baseDependencies.express = pkg.dependencies.express
    baseDependencies['body-parser'] = pkg.dependencies['body-parser']
  }

  const promises = [
    writeFile(path.join(distDir, 'package.json'), JSON.stringify({
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
  ]

  if (staticDir) {
    promises.push(copyDir(path.join(baseDir, staticDir), path.join(distDir, staticDir)))
  }

  if (appPackage.files) {
    appPackage.files.forEach(filename => {
      const filePath = path.join(baseDir, filename)
      if (fs.lstatSync(filePath).isDirectory()) {
        promises.push(copyDir(filePath, path.join(distDir, filename)))
      } else {
        promises.push(copyFile(filePath, path.join(distDir, filename)))
      }
    })
  }


  await Promise.all(promises)
}

export default copy
