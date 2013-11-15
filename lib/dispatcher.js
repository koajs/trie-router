var Router = require('./router')

Router.prototype.dispatcher = function () {
  var trie = this.trie

  return function* (next) {
    var match = trie.match(this.request.path)
    var node = match && match.node
    // If no match, go to next middleware
    if (!node)
      return yield next

    // If no HEAD middleware, default to GET.
    var method = this.method
    if (method === 'HEAD' && !node.HEAD)
      method = 'GET'

    // OPTIONS support
    if (method === 'OPTIONS') {
      this.status = 204
      this.set('Allow', node.methods)
      return
    }

    // If no generator function is returned
    // it's a 405 error
    var gen = node[method]
    if (!gen)
      return methodNotAllowed.call(this, node)

    this.params = this.request.params = match.param

    // Not liking this most likely unnecessary closure.
    // Not sure if this should be a 404 or 405 as
    // I would consider this a developer error.
    // Every defined method in a route _should_ be handled.
    yield* gen.call(this, methodNotAllowed)
  }
}

function methodNotAllowed(node) {
  this.set('Allow', node.methods)
  this.status = 405
}