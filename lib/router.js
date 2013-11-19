var routington = require('routington')

module.exports = Router

function Router(app) {
  if (!(this instanceof Router))
    return new Router(app)

  this.app = app
  this.methods = {
    OPTIONS: true
  }

  var trie = this.trie = routington()
  this.routes()

  app.router = this.dispatcher()
  app.router.define = function (str) {
    return trie.define(str)
  }
  app.router.match = function (str) {
    return trie.match(str)
  }
  app.request.assertImplementsMethod = this.assertImplementsMethod()

  return app
}

Router.prototype.assertImplementsMethod = function () {
  var methods = this.methods

  return function () {
    if (!methods[this.method])
      this.ctx.error(501, this.method + ' is not implemented')
    return this
  }
}