import path from 'path'
import map from '__@@BEIMO_SOURCE__/pages/index.yml' // eslint-disable-line
import Beimo from './Beimo.server'

export default new Beimo(
  map,
  process.env.BUILD_ID,
  path.resolve(__dirname, process.env.REL_STATIC_DIR),
)
