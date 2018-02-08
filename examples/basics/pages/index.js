import React from 'react'
import page, { ERROR_PAGE, NOT_FOUND_PAGE } from 'beimo/page'
import about from './about'
import '../basics.css'

const pages = [
  page('home', { path: '/', props: { haha: 1 }, loading: () => <h1>Loading 2</h1> }),
  page('home', { path: '/news', loading: () => <h1>Loading 2</h1> }),
  page('home', { path: '/news/categories', loading: () => <h1>Loading 2</h1> }),
  page('redirect', { path: '/redirect' }),
  page('redirect2', { path: '/redirect2' }),
  about,
  page('test', { path: '/test2' }),
  page('_error', { as: ERROR_PAGE }),
  page('_miss', { as: NOT_FOUND_PAGE }),
]

export default pages
