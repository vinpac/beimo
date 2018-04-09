const createDecorator = fn => {
  return (component, next = component.getInitialProps) => {
    component.getInitialProps = params => fn(params, () => next(params))
    return component
  }
}

export default createDecorator(
  ({ query, send }, next) => {
    if (query.auth) {
      send({ redirect: '/login' })
      return undefined
    }

    return next()
  }
)
