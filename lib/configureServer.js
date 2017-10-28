import fs from 'fs'
import path from 'path'

export default (server, handle) => {
  if (!module.hot) {
    handle(server)
  } else {
    server.hot = module.hot
    module.hot.accept('./pages')

    if (fs.existsSync(path.resolve('routes/index.js'))) {
      module.hot.accept('./routes')
    }
  }
}
