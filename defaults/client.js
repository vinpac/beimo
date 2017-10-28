import beimo from './instance'

window.APP_STATE = window.APP_STATE || {}

if (!process.env.HAS.CLIENT) {
  beimo.hydrate(document.getElementById('root'))
}

export default () => {
  beimo.hydrate(document.getElementById('root'))
}
