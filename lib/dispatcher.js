var Router = require('./router')

Router.prototype.dispatcher = function () {
  var trie = this.trie

  return function* (next) {
    var match = trie.match(this.request.path)
    var node = match && match.node
    // If no match, go to next middleware
    if (!node)
      return yield* next

    // If no HEAD middleware, default to GET.
    var method = this.method
    if (method === 'HEAD' && !node.HEAD)
      method = 'GET'

    // OPTIONS support
    if (method === 'OPTIONS') {
      this.response.status = 204
      this.response.set('Allow', node.methods)
      return
    }

    // If no generator function is returned
    // it's a 405 error
    var gen = node[method]
    if (!gen) {
      this.response.set('Allow', node.methods)
      this.response.status = 405
      return
    }

    this.params = this.request.params = match.param
    yield* gen.call(this)
  }
}