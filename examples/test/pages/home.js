import React from 'react'
import Link from 'beimo/link'
import Redirect from 'beimo/redirect'

const home = ({ loading, a }) => (
  <h1>
    a <Link to="/about">asd</Link> dajd {a} {loading && 'carregando'}
  </h1>
)

home.getInitialProps = ({ query, yieldProps, send, ...a }) => {
  return { loading: true }
}

export default home
