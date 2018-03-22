import { ERROR_PAGE } from 'beimo/page'

export default {
  name: '@beimo/error',
  chunk: '_beimo.default.error',
  id: '@beimo/error',
  load: () => import(/* webpackChunkName: 'pages/_beimo.default.error' */'./DefaultErrorPage'),
  as: ERROR_PAGE,
  __BEIMO_PAGE__: true,
}
