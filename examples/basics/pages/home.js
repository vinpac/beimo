import React from 'react'
import Link from 'beimo/link'
import { NotFoundPage } from 'beimo/router'
import s from '../home.css'

const Home = () => (
  <div className={`page ${s.component}`}>
    <h1 className="title">Home</h1>
    <Link to="/about">About</Link>
    <br />
    <Link to="/?error=1">Throw error on getInitialProps</Link>
    <br />
    <Link to="/?miss=1">Not found by throwing error</Link>
    <br />
    <Link to="/some-page">Not found page by url</Link>
  </div>
)

Home.displayName = 'Home'
Home.path = '/'
Home.getInitialProps = ({ query }) => {
  if (query.error) {
    throw new Error('Some error')
  }

  if (query.miss) {
    throw new NotFoundPage()
  }
}

export default Home
