var routington = require('routington')

module.exports = Router

function Router(app) {
  this.app = app
  this.methods = {
    OPTIONS: true
  }

  this.trie = routington()
  this.routes()
}

Router.prototype.assertImplementsMethod = function () {
  var methods = this.methods

  return function () {
    if (!methods[this.method]) this.throw(501, this.method + ' is not implemented')
    return this
  }
}
