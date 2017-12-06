import path from 'path'
import PagesLoader from '../../src/loaders/PagesLoader'

describe('PagesLoader', () => {
  it('should run with no errors', () => {
    PagesLoader.call(
      {
        query: { pagesPath: path.join(__filename, '../../examples/basics/pages') },
        context: path.join(__filename, '../../examples/basics/pages/about'),
      },
      `
      import React from 'react'
      import p from 'beimo/page'

      export default p('./AboutPage',{ path: '/about', loading: () => <h1>Loading About</h1> })
    `,
    )
  })
})
