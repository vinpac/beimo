import hash from 'string-hash'

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
