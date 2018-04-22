import { createMemoryHistory } from 'history'
import Beimo from '../client/Beimo.client'
import { NotFoundPage, Redirect } from '../modules/router'
import createRouterMap from '../build/parse-routes-map'

const map = (() => {
  const routes = createRouterMap({
    home: '/',
    post: [{ '/post/:slug': { bar: 'foo' } }],
  })

  return {
    routes,
    pages: ['home', 'post'],
  }
})()

describe('Beimo server', () => {
  it('should call a hook', done => {
    const history = createMemoryHistory()
    const beimo = new Beimo(map, '1', {}, history)
    beimo.loadTimeout = 200

    const PostPage = () => {}
    PostPage.getInitialProps = ({ yieldProps, render, ...props }) => {
      yieldProps({ foo: 'yaz' })
      render()
      throw new Redirect('/')
      return { foo: 'bar' }
    }
    beimo.chunks['pages/post'] = PostPage
    beimo.chunks['pages/home'] = () => 'home'
    beimo.chunks['pages/_error'] = ({ error }) => error.name

    beimo.hooks.render.tap((page, component, props, error) => {
      if (page === 'home') {
        console.log(error)
        done()
      }
    })
    beimo.hooks.state.tap(state => console.log(state))
    beimo.history.push('/post/post-1')
  })
})
