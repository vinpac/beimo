class Hook {
  constructor(name) {
    this.name = name
    this.consumers = []
  }

  tap = consumer => {
    this.consumers.push(consumer)
  }

  untap = untapped => {
    this.consumers = this.consumers.filter(consumer => consumer !== untapped)
  }

  call = (...args) => {
    this.consumers.forEach(fn => fn(...args))
  }
}

export default Hook
