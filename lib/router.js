var routington = require('routington')

module.exports = Router

function Router(app) {
  if (!(this instanceof Router))
    return new Router(app)

  this.app = app
  this.methods = {
    OPTIONS: true
  }

  this.trie = routington()
  this.routes()

  app.router = this.dispatcher()
  app.request.implementsMethod = this.implementsMethod()

  return app
}

Router.prototype.implementsMethod = function () {
  var methods = this.methods

  return function () {
    if (!methods[this.method])
      this.ctx.error(501, this.method + ' is not implemented')
    return this
  }
}