import React from 'react'
import Link from 'beimo/link'

const Home = () => (
  <div>
    <h1>Home</h1>
    <Link to="/about">About</Link>
  </div>
)

Home.displayName = 'Home'
Home.path = '/'

export default Home
