import beimo from './app'

window.APP_STATE = window.APP_STATE || {}

beimo.hydrate(document.getElementById('root'))
