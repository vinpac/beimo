import page, { ERROR_PAGE, NOT_FOUND_PAGE } from 'beimo/page'
import '../basics.css'

const pages = [
  page('home', '/', { haha: 1 }),
  page('home', '/news'),
  page('home', '/news/categories'),
  page('redirect', '/redirect'),
  page('redirect2', '/redirect2'),
  page('test', '/test2'),
  page('_error', ERROR_PAGE),
  page('_miss', NOT_FOUND_PAGE),
]

export default pages
