import React from 'react'
import page from 'beimo/page'
import about from './about'
import '../basics.css'

const pages = [
  page('./home', { path: '/', loading: () => <h1>Loading</h1> }),
  page('./home', { path: '/news' }),
  page('./home', { path: '/news/categories' }),
  about,
  page('./_error', { use: 'error' }),
  page('./_miss', { use: 'miss' }),
]


export default pages
