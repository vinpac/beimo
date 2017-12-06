import React from 'react'
import Link from 'beimo/link'
import Head from 'beimo/head'
import s from '../../about.css'

const About = () => (
  <div className="page">
    <Head>
      <title>About</title>
      <meta name="description" content="About page" />
    </Head>
    <h1 className={s.title}>About</h1>
    <Link to="/">Home</Link>
  </div>
)

About.displayName = 'About'
export default About
