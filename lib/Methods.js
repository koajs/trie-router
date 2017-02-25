


class Methods extends Map {
  /**
   * @param {String} key
   * @param {Array<Function>} [middleware]
   */
  add(key, middleware = []) {
    let stack = this.get(key)
    stack.push(...middleware)
    this.set(key, stack)
  }
  /**
   * @param {String} key
   * @returns {Array<Function>}
   */
  get(key) {
    return super.get(key) || []
  }
  /**
   * @param {String} key
   * @returns {Boolean}
   */
  hasMiddleware(key) {
    return Boolean(this.get(key).length)
  }
  /**
   * @param {String} key
   * @param {Array<Function>} [middleware]
   */
  set(key, middleware = []) {
    super.set(key, middleware)
  }
  /**
   * @returns {String}
   */
  toString() {
    return String([...this.keys()])
  }
}


module.exports = Methods