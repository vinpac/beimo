import page from 'beimo/page'
import about from './about'

export default [
  page('test', { path: '/test' }),
  page('test2', { path: '/test2' }),
  about,
  page('home', { path: '/', props: { a: '3' } }),
]
