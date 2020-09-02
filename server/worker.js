class Worker {
  constructor (config) {
    this.config = config
  }

  onConstruction() {
    console.log(`${this.name} is constructed.`)
  }
}

export default Worker