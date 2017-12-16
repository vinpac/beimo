import React from 'react'
import page from 'beimo/page'
import about from './about'
import '../basics.css'

const pages = [
  page('./home', { path: '/', loading: () => <h1>Loading 2</h1> }),
  page('./home', { path: '/news', loading: () => <h1>Loading 2</h1> }),
  page('./home', { path: '/news/categories', loading: () => <h1>Loading 2</h1> }),
  about,
  page('./_error', { use: 'error' }),
  page('./_miss', { use: 'miss' }),
]


export default pages
