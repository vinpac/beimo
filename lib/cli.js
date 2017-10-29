import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import commander from 'commander'
import pkg from '../package.json'
import start from '../lib/start'
import build from '../lib/build'

let action = ''
const program = new commander.Command(pkg.name)
  .version(pkg.version)
  .arguments('<source-directory>')
  .action(name => { action = name })
  .option('--release', 'release')
  .option('--verbose', 'verbose')
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
  distDir: program.output,
  distPath: path.resolve(sourcePath, program.output),
  staticDir: program.staticDir,
  staticPath: path.resolve(basePath, program.staticDir),
  port: program.port,
  has: {
    server: fs.existsSync(path.resolve(sourcePath, 'server.js')),
    client: fs.existsSync(path.resolve(sourcePath, 'client.js')),
    pages: fs.existsSync(path.resolve(sourcePath, 'pages', 'index.js')),
    routes: fs.existsSync(path.resolve(sourcePath, 'routes', 'index.js')),
    configureApp: fs.existsSync(path.resolve(basePath, 'beimo.app.js')),
  },
  hot: true,

  // App Configuration
  parseWebpackConfig: appConfiguration.webpack,
  files: appConfiguration.files || [],
  watchOptions: appConfiguration.watchOptions || {},
}


if (params.isRelease) {
  process.env.NODE_ENV = 'production'
}

switch (action) {
  case 'build':
    build(params)
    break
  default:
    start(params).catch(error => {
      console.error(error)
      process.exit(1, error)
    })
}
