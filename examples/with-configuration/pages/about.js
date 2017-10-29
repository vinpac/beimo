import React from 'react'

const About = ({ b }) => (
  <div>
    <h1>About {b}</h1>
  </div>
)

About.displayName = 'About'
About.path = '/about'
About.getInitialProps = () => {
  return { b: 3 }
}

export default About
