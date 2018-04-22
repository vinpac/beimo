let create
export function configure(fn) {
  create = fn
}

export default instance => {
  if (!create) {
    throw new Error('Starting a dev server is not possible yet')
  }

  return create(instance)
}
