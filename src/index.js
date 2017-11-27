import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import commander from 'commander'
import pkg from '../package.json'
import start from './scripts/start'
import build from './scripts/build'

// Install source map
// eslint-disable-next-line
__non_webpack_require__('source-map-support').install()

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})


let action = ''
const program = new commander.Command(pkg.name)
  .version(pkg.version)
  .arguments('<source-directory>')
  .action(name => { action = name })
  .option('--verbose', 'verbose')
  .option('--release', 'indicates if build for production')
  .option('--port <port-number>', 'server port [3000]', 3000)
  .option('--base <base-directory>', 'base directory [.]', '')
  .option('--source <source-directory>', 'source directory [.]', '')
  .option('--output <output-directory>', 'output directory [dist]', 'dist')
  .option('--static-dir <static-directory>', 'static directory [static]', 'static')
  .on('--help', () => {
    /* eslint-disable no-console */
    console.log()
    console.log('    If you have any problems, do not hesitate to file an issue:')
    console.log(`      ${chalk.cyan(`https://github.com/vinpac/${pkg.name}/issues/new`)}`)
    console.log()
    /* eslint-enable no-console */
  })
  .usage('[options]')
  .parse(process.argv)

if (program.release) {
  process.env.NODE_ENV = 'production'
}

const basePath = path.resolve(program.base)
const sourcePath = path.resolve(program.base, program.source)

let appPackage
try {
  appPackage = JSON.parse(fs.readFileSync(path.resolve(basePath, 'package.json')), 'utf8')
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error(`Error parsing ${path.resolve(basePath, 'package.json')}.`)
    throw error
  }
}

let appConfiguration = {}

if (fs.existsSync(path.resolve(basePath, 'beimo.config.js'))) {
  // eslint-disable-next-line
  appConfiguration = __non_webpack_require__(path.resolve(basePath, 'beimo.config.js'))
}

const params = {
  sourcePath,
  basePath,
  appPackage,
  isRelease: !!program.release,
  isVerbose: !!program.verbose,
  pagesPath: path.join(sourcePath, 'pages'),
  distDir: program.output,
  distPath: path.resolve(sourcePath, program.output),
  staticDir: program.staticDir,
  staticPath: path.resolve(basePath, program.staticDir),
  port: program.port,
  has: {
    server: fs.existsSync(path.resolve(sourcePath, 'server.js')),
    client: fs.existsSync(path.resolve(sourcePath, 'client.js')),
    pages: fs.existsSync(path.resolve(basePath, 'pages', 'index.js')),
    configureApp: fs.existsSync(path.resolve(basePath, 'beimo.app.js')),
  },

  // App Configuration
  parseWebpackConfig: appConfiguration.webpack,
  files: appConfiguration.files || [],
  watchOptions: appConfiguration.watchOptions || {},
}


if (params.isRelease || action === 'build') {
  process.env.NODE_ENV = 'production'
}

if (!params.has.pages) {
  console.error(`You must provide a ${chalk.green('pages/index')}.`)
  process.exit(1)
}

switch (action) {
  case 'build':
    params.isRelease = true
    build(params)
    break
  case 'build-dev':
    params.isRelease = false
    build(params)
    break
  case 'test':
    break
  case 'dev':
  case '':
    start(params).catch(error => {
      console.error(error)
      process.exit(1, error)
    })
    break
  default:
    console.error('Unknown action. Try beimo --help')
    process.exit(1)
}
