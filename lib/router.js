/* eslint-disable import/prefer-default-export */

export class NotFoundPage extends Error {
  constructor(message: ?string) {
    super(message)

    this.name = 'NotFoundPage'
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
    }
  }
}
