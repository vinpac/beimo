import React from 'react'
import page from 'beimo/page'
import about from './about'
import '../basics.css'

const pages = [
  page('./home', { path: '/', pageProps: { haha: 1 }, loading: () => <h1>Loading 2</h1> }),
  page('./home', { path: '/news', loading: () => <h1>Loading 2</h1> }),
  page('./home', { path: '/news/categories', loading: () => <h1>Loading 2</h1> }),
  page('./redirect', { path: '/redirect' }),
  page('./redirect2', { path: '/redirect2' }),
  about,
  page('./_error', { use: 'error' }),
  page('./_miss', { use: 'miss' }),
]


export default pages
