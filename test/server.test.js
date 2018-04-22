import Beimo from '../server/Beimo.server'
import createRouterMap from '../build/create-router-map'

const map = (() => {
  const routes = createRouterMap({
    home: '/',
    post: '/post/:slug',
  })

  return {
    routes,
    pages: ['home', 'post'],
  }
})()

const beimo = new Beimo(map, '1', '../public')

describe('Beimo server', () => {
  it('match a page by path', () => {
    expect(beimo.matchPath('/')).toEqual({
      route: map.routes[0],
      match: {
        path: '/',
        pathname: '/',
        params: {},
        query: {},
      },
    })

    expect(beimo.matchPath('/?count=1&count=2')).toEqual({
      route: map.routes[0],
      match: {
        path: '/?count=1&count=2',
        pathname: '/',
        params: {},
        query: { count: ['1', '2'] },
      },
    })

    expect(beimo.matchPath('/post/post-1?show=2')).toEqual({
      route: map.routes[1],
      match: {
        path: '/post/post-1?show=2',
        pathname: '/post/post-1',
        params: { slug: 'post-1' },
        query: { show: '2' },
      },
    })

    expect(beimo.matchPath('/not-found')).toEqual({
      route: null,
      match: null,
    })
  })

  it('should load initial props', async () => {
    const match = { path: '/post?show=1', pathname: '/post' }
    const context = { count: 12 }
    const req = {}
    const res = {}

    let loadProps
    if (beimo.name === 'server') {
      loadProps = fn =>
        beimo.loadPageInitialProps({ getInitialProps: fn }, { ...match, req, res }, context)
    } else {
      loadProps = fn => beimo.loadPageInitialProps({ getInitialProps: fn }, { ...match }, context)
    }

    await loadProps(() => ({ count: 10 })).then(props => {
      expect(props).toEqual({ count: 10 })
    })

    await loadProps(params => params.yieldProps({ count: 11 })).then(props => {
      expect(props).toEqual({ count: 11 })
    })

    await loadProps(params => params.render({ count: 12 })).then(props => {
      expect(props).toEqual({ count: 12 })
    })

    await loadProps(params => {
      params.yieldProps({ count: 12 })
      params.render({ count: 13 })

      expect(params.render).toThrowError('Render called more than once')
    }).then(props => {
      expect(props).toEqual({ count: 13 })
    })

    await loadProps(params => {
      params.yieldProps({ count: 12 })
      params.render({ count: 13 })

      expect(params.render).toThrowError('Render called more than once')
    }).then(props => {
      expect(props).toEqual({ count: 13 })
    })

    const error = new Error('Some error')
    let thrownError
    try {
      await loadProps(() => {
        throw error
      })
    } catch (err) {
      thrownError = err
    }
    expect(thrownError).toEqual(error)
  })
})
