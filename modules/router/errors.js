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
      stack: __DEV__ ? this.stack : '',
    }
  }
}

export class Redirect extends Error {
  constructor(to, action = 'push') {
    super(`${action} to '${to}'`)

    this.name = 'Redirect'
    this.to = to
    this.status = 302
    this.action = action
  }

  toJSON() {
    return {
      name: this.name,
      to: this.to,
      message: this.message,
      status: this.status,
      stack: __DEV__ ? this.stack : '',
    }
  }
}
