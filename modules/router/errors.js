/* eslint-disable import/prefer-default-export */

export class PageNotFoundError extends Error {
  constructor(message) {
    super(message)

    this.name = 'PageNotFoundError'
    this.status = 404
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
    }
  }
}
