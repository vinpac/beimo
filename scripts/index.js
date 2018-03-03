import { existsSync } from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import commander from 'commander'
import pkg from '../../package.json' // eslint-disable-line

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
  .option('--base <base-directory>', 'base directory [.]', '')
  .option('--source <source-directory>', 'source directory [.]', '')
  .option('--public-dir <public-directory>', 'public directory [public]', 'public')
  .option('--output <output-directory>', 'output directory [dist]', 'dist')
  .on('--help', () => {
    /* eslint-disable no-console */
    console.log()
    console.log('    If you have any problems, do not hesitate to file an issue:')
    console.log(`      ${chalk.cyan(`https://github.com/vinpac/${pkg.name}/issues/new`)}`)
    console.log()
    /* eslint-enable no-console */
  })
  .usage('[options]')
  .parse(process.argv.filter(arg => arg !== '--no-console-clear'))

// Define NODE_ENV = 'production' when releasing a build
if (program.release) process.env.NODE_ENV = 'production'

let appConfig

if (existsSync(resolve(program.base, 'beimo.config.js'))) {
  // eslint-disable-next-line no-undef
  appConfig = __non_webpack_require__(resolve(program.base, 'beimo.config.js'))
}

const buildId = String(Date.now())
const params = {
  ...appConfig,
  buildId,
  publicPath: `/_beimo_/${buildId}/`,
  baseDir: resolve(program.base),
  sourceDir: resolve(program.base, program.source),
  staticDir: program.publicDir,
  distDir: resolve(program.base, program.output),
  isRelease: !!program.release,
  isVerbose: !!program.verbose,
  overrideServer: existsSync(resolve(program.base, program.source, 'server.js')),
}

switch (action) {
  case 'build':
    params.isRelease = true
    require('./build').default(params).catch(error => {
      console.error(error)
      process.exit(1, error)
    })
    break
  case 'dev':
  case '':
    require('./dev').default(params).catch(error => {
      console.error(error)
      process.exit(1, error)
    })
    break
  default:
    console.error('Unknown action. Try beimo --help')
    process.exit(1)
}
