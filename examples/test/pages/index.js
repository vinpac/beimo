import page from 'beimo/page'
import about from './about'

export default [
  page('test', { path: '/test' }),
  about,
  page('home', { path: '/', props: { a: '3' } }),
]
