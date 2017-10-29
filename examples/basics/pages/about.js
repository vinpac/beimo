import React from 'react'
import Link from 'beimo/link'

const About = () => (
  <div>
    <h1>About</h1>
    <Link to="/">Home</Link>
  </div>
)

About.displayName = 'About'
About.path = '/about'

export default About