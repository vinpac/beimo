import React from 'react'
import { NotFound } from 'beimo/router'
import Route from 'beimo/route'
import Link from 'beimo/nav-link'

const about = ({ error, loading }) => (
  <h1>
    <Link to="/test"> asdasdqasdwqeqwe sd</Link>
    Aboasd asdut {loading && 'carregando'}

    <Link activeStyle={{ color: 'red' }} to="/user">user</Link>

    <Route path="/user">
      qweqwewqe
    </Route>
  </h1>
)

about.getInitialProps = ({ error, yieldProps, send, ...a }) => {
  yieldProps({ loading: true })
  //  throw new NotFound('asdsd')
}

export default about
