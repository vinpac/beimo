import parseRegExp from '../build/utils/parse-regexp'

const queue = {}

function send(type, payload, meta) {
  process.send({ type, payload, meta })
}

function clearDirCache(dir) {
  // eslint-disable-next-line no-undef
  Object.keys(require.cache).forEach(modulePath => {
    if (modulePath.startsWith(dir)) {
      // eslint-disable-next-line no-undef
      delete require.cache[modulePath]
    }
  })
}

let sentRequestId = 0
function sendAsync(type, payload) {
  sentRequestId += 1

  if (!queue[type]) {
    queue[type] = {}
  }

  return new Promise(resolve => {
    queue[type][sentRequestId] = resolve
    send(type, payload, { id: sentRequestId })
  })
}

process.on('message', action => {
  if (queue[action.type]) {
    const fn = queue[action.type][action.meta.id]

    if (action.error) {
      fn(new Error(action.payload))
      return
    }

    fn(action.payload)
  }
})

export default async (instance, listen) => {
  const defaultHandle = instance.handle
  const defaultEnsurePage = instance.ensurePage
  let distDir

  await sendAsync('start').then(({ distDir: nextDistDir, pages, routes }) => {
    distDir = nextDistDir
    Object.assign(instance, {
      pages,
      routes: routes.map(route => {
        if (route.matcher) {
          return {
            ...route,
            matcher: {
              ...route.matcher,
              re: parseRegExp(route.matcher.re),
            },
          }
        }

        return route
      }),
    })
  })

  instance.ensurePage = page => {
    defaultEnsurePage(page)
    clearDirCache(distDir)

    return sendAsync('ensure-page', page)
  }

  instance.handle = async (req, res, error) => {
    await sendAsync('handle', {
      method: req.method,
      headers: req.headers,
      url: req.url,
      path: req.path,
    }).then(response => {
      if (response) {
        const { type, body } = response

        if (response.headers) {
          response.headers.forEach(header => {
            res.setHeader(...header)
          })
        }

        if (type === 'buffer') {
          res.send(Buffer.from(body.data))
          return
        }

        if (type === 'json') {
          res.json(body)
          return
        }

        res.send(body)
        return
      }

      defaultHandle(req, res, error)
    })
  }

  return listen()
}
