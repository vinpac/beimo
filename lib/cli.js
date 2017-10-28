import path from 'path'
import chalk from 'chalk'
import commander from 'commander'
import pkg from '../package.json'
import start from '../lib/start'

console.log(__dirname)
let sourceDir = ''
const program = new commander.Command(pkg.name)
  .version(pkg.version)
  .arguments('<source-directory>')
  .action(dir => { sourceDir = dir })
  .option('--release', 'release')
  .option('--verbose', 'verbose')
  .option('--port <port-number>', 'server port [3000]', 3000)
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

const options = {
  basePath: path.resolve(),
  sourcePath: path.resolve(sourceDir),
  reldir: sourceDir,
  isRelease: !!program.release,
  isVerbose: !!program.verbose,
  distDir: program.dist,
  staticDir: program.staticDir,
  port: program.port,
}

start(options)
  .catch(error => {
    console.log(error)
  })
