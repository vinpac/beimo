import createRouterMap from '../build/create-router-map'

describe('Build', () => {
  describe('Create router map', () => {
    test('Basics', () => {
      expect(
        createRouterMap({
          home: '/',
          about: '/about',
        }),
      ).toEqual({
        routes: [
          { id: '0', page: 'home', matcher: { re: /^\/(?:\/)?$/i, keys: [] } },
          { id: '1', page: 'about', matcher: { re: /^\/about(?:\/)?$/i, keys: [] } },
        ],
        pages: ['home', 'about'],
      })
    })

    test('Flatten children', () => {
      expect(
        createRouterMap({
          home: '/',
          project: {
            view: '/project/:slug',
            edit: '/project/edit/:slug',
          },
        }),
      ).toEqual({
        routes: [
          { id: '0', page: 'home', matcher: { re: /^\/(?:\/)?$/i, keys: [] } },
          {
            id: '1',
            page: 'project/view',
            matcher: { re: /^\/project\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
          {
            id: '2',
            page: 'project/edit',
            matcher: { re: /^\/project\/edit\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
        ],
        pages: ['home', 'project/view', 'project/edit'],
      })
    })

    test('Path prefix', () => {
      expect(
        createRouterMap({
          home: '/',
          '(/project)': {
            project: {
              view: '/:slug',
              '(/edit)': { edit: '/:slug' },
            },
          },
        }),
      ).toEqual({
        routes: [
          { id: '0', page: 'home', matcher: { re: /^\/(?:\/)?$/i, keys: [] } },
          {
            id: '1',
            page: 'project/view',
            matcher: { re: /^\/project\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
          {
            id: '2',
            page: 'project/edit',
            matcher: { re: /^\/project\/edit\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
        ],
        pages: ['home', 'project/view', 'project/edit'],
      })
    })

    test('Path list', () => {
      expect(
        createRouterMap({
          home: '/',
          '(/project)': { project: ['/:slug', '/edit/:slug'] },
        }),
      ).toEqual({
        routes: [
          { id: '0', page: 'home', matcher: { re: /^\/(?:\/)?$/i, keys: [] } },
          {
            id: '1',
            page: 'project',
            matcher: { re: /^\/project\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
          {
            id: '2',
            page: 'project',
            matcher: { re: /^\/project\/edit\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
        ],
        pages: ['home', 'project', 'project'],
      })
    })

    test('Passing props', () => {
      expect(
        createRouterMap({
          home: '/',
          '(/project)': {
            project: [
              {
                '/:slug': { renderForm: false },
                '/edit/:slug': { renderForm: true },
              },
            ],
          },
        }),
      ).toEqual({
        routes: [
          { id: '0', page: 'home', matcher: { re: /^\/(?:\/)?$/i, keys: [] } },
          {
            id: '1',
            page: 'project',
            props: { renderForm: false },
            matcher: { re: /^\/project\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
          {
            id: '2',
            page: 'project',
            props: { renderForm: true },
            matcher: { re: /^\/project\/edit\/([^/]+?)(?:\/)?$/i, keys: ['slug'] },
          },
        ],
        pages: ['home', 'project', 'project'],
      })
    })
  })
})
