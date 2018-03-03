import { cleanDir } from '../build/utils/fs'

/**
 * Cleans up the output directory.
 */
function clean({ distDir }) {
  return Promise.all([
    cleanDir(`${distDir}/*`, {
      nosort: true,
      dot: true,
      ignore: [`${distDir}/.git`],
    }),
  ])
}

export default clean
