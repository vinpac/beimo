import beimo from './instance'

window.APP_STATE = window.APP_STATE || {}

if (!process.env.HAS.CLIENT) {
  console.log('HYDRATED')
  beimo.hydrate(document.getElementById('root'))
}

export default appOptions => {
  beimo.set(appOptions)
  beimo.hydrate(document.getElementById('root'))
}
