import { ERROR_PAGE } from 'beimo/page'

export default {
  name: '@beimo/error',
  id: '_beimo.default.error',
  load: () => import(/* webpackChunkName: 'pages/_beimo.default.error' */'./DefaultErrorPage'),
  as: ERROR_PAGE,
  __BEIMO_PAGE__: true,
}
