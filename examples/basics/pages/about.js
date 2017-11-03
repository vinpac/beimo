import React from 'react'
import Link from 'beimo/link'
import Head from 'beimo/head'
import '../about.css'

const About = () => (
  <div className="page">
    <Head>
      <title>About</title>
      <meta name="description" content="About page"/>
    </Head>
    <h1 className="title">About</h1>
    <Link to="/">Home</Link>
  </div>
)

About.displayName = 'About'
About.path = '/about'

export default About
