/* eslint-disable import/prefer-default-export */

import path from 'path'
import { PageNotFoundError } from '../modules/router'

export function requirePage(page) {
  try {
    // eslint-disable-next-line no-undef
    const module = __non_webpack_require__(path.resolve(__dirname, 'pages', page))
    return module.default || module
  } catch (error) {
    if (error.message.startsWith('Cannot find module')) {
      throw new PageNotFoundError(page)
    }

    throw error
  }
}
