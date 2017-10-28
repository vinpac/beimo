import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import commander from 'commander'
import pkg from '../package.json'
import start from '../lib/start'

let sourceDir = ''
const program = new commander.Command(pkg.name)
  .version(pkg.version)
  .arguments('<source-directory>')
  .action(dir => { sourceDir = dir })
  .option('--release', 'release')
  .option('--verbose', 'verbose')
  .option('--port <port-number>', 'server port [3000]', 3000)
  .option('--base <base-directory>', 'base directory [.]', '')
  .option('--dist <destination-directory>', 'destination directory [dist]', 'dist')
  .option('--static-dir <static-directory>', 'static directory [static]', 'static')
  .on('--help', () => {
    console.log()
    console.log('    If you have any problems, do not hesitate to file an issue:')
    console.log(`      ${chalk.cyan(`https://github.com/vinpac/${pkg.name}/issues/new`)}`)
    console.log()
  })
  .usage('[options]')
  .parse(process.argv)

if (program.release) {
  process.env.NODE_ENV = 'production'
}

const basePath = path.resolve(program.base)
const sourcePath = path.resolve(program.base, sourceDir)

let appPackage
try {
  appPackage = JSON.parse(fs.readFileSync(path.resolve(basePath, 'package.json')), 'utf8')
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error(`Error parsing ${path.resolve(basePath, 'package.json')}.`)
    throw error
  }
}

let appConfiguration

if (fs.existsSync(path.resolve(basePath, 'beimo.config.js'))) {
  // eslint-disable-next-line
  appConfiguration = __non_webpack_require__(path.resolve(basePath, 'beimo.config.js'))
}

const params = {
  ...appConfiguration,
  sourcePath,
  basePath,
  appPackage,
  isRelease: !!program.release,
  isVerbose: !!program.verbose,
  distDir: program.dist,
  distPath: path.resolve(sourcePath, program.dist),
  staticDir: program.staticDir,
  port: program.port,
  has: {
    server: fs.existsSync(path.resolve(sourcePath, 'server.js')),
    client: fs.existsSync(path.resolve(sourcePath, 'client.js')),
    pages: fs.existsSync(path.resolve(sourcePath, 'pages', 'index.js')),
    routes: fs.existsSync(path.resolve(sourcePath, 'routes', 'index.js')),
  },
}


if (params.isRelease) {
  process.env.NODE_ENV = 'production'
}

start(params)
  .catch(error => {
    console.log(error)
    process.exit(1, error)
  })
