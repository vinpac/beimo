import Beimo from './Beimo.client'
import routerMap from '__@@BEIMO_SOURCE__/pages/index.yml' // eslint-disable-line

export default new Beimo(routerMap, process.env.BUILD_ID)
