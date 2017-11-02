import React from 'react'
import Link from 'beimo/link'
import '../about.css'

const About = () => (
  <div className="page">
    <h1 className="title">About</h1>
    <Link to="/">Home</Link>
  </div>
)

About.displayName = 'About'
About.path = '/about'

export default About
