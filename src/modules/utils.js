/* eslint-disable import/prefer-default-export */
import DefaultErrorPage from '../entry/pages/error'
import { ERROR_PAGE } from 'beimo/page'

export function normalizePages(pages) {
  if (!pages.some(page => page.as === ERROR_PAGE)) {
    pages.push(DefaultErrorPage)
  }

  return pages
}
