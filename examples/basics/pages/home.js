import React from 'react'
import { NotFound } from 'beimo/router'
import Link from 'beimo/link'
import Head from 'beimo/head'
import s from '../home.css'

class HomePage extends React.Component {
  static getInitialProps = ({ query, props }) => {
    if (query.error) {
      throw new Error('Some error')
    }

    if (query.miss) {
      throw new NotFound()
    }

    return { a: 3 + (props.haha || 0) }
  }

  state = { count: 0 }

  render() {
    const { a } = this.props
    const { count } = this.state

    return (
      <div className={`page ${s.component}`}>
        <Head>
          <title>Basic example</title>
          <meta name="description" content="Home page" />
        </Head>
        {a}
        <button onClick={() => this.setState({ count: count + 1 })}>Count: {count}</button>
        <Link to="/">Home 1</Link>
        <Link to="/news">Home 2</Link>
        <Link to="/news/categories">Home 3</Link>
        <h1 className="title">Home</h1>
        <Link to="/about">About</Link>
        <br />
        <Link to="/?error=1">Throw error on getInitialProps</Link>
        <br />
        <Link to="/?miss=1">Not found by throwing error</Link>
        <br />
        <Link to="/some-page">Not found page by url</Link>
        <br />
        <Link to="/redirect">Redirect 1</Link>
        <br />
        <Link to="/redirect2">Redirect 2</Link>
      </div>
    )
  }
}

export default HomePage
