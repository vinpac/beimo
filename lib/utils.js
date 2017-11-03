import hash from 'string-hash'

function createErrorPageResolver(missPage, fn) {
  return error => {
    if (error.name === 'NotFoundPage') {
      return missPage
    }

    return fn ? fn(error) : undefined
  }
}

export function parsePagesConfig(pagesConfig) {
  if (Array.isArray(pagesConfig)) {
    return { pages: pagesConfig }
  }

  const { pages, missPage, resolveErrorPage } = pagesConfig

  if (missPage) {
    missPage.path = undefined
  }

  return {
    pages: missPage ? pages.concat([missPage]) : pages,
    resolveErrorPage: missPage
      ? createErrorPageResolver(missPage, resolveErrorPage)
      : resolveErrorPage,
  }
}

export function mapPages(pages) {
  const usedCount = {}
  return pages.map(page => {
    page.id = hash(`${page.displayName}${page.path}`)
    if (usedCount[page.id] > 0) {
      page.id += `-${usedCount[page.id]}`
      usedCount[page.id] += 1
    } else {
      usedCount[page.id] = 1
    }

    page.exact = page.path && page.exact !== false

    return page
  })
}

export const Wrap = ({ children }) => children
