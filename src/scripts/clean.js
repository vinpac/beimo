import { cleanDir } from '../lib/fs'

/**
 * Cleans up the output directory.
 */
function clean({ distPath }) {
  return Promise.all([
    cleanDir(`${distPath}/*`, {
      nosort: true,
      dot: true,
      ignore: [`${distPath}/.git`],
    }),
  ])
}

export default clean
