var Router = exports.Router = require('./router')

require('./routes')
require('./dispatcher')

module.exports = function (app, options) {
  var router = new Router(app, options || {})

  app.router = router.dispatcher()
  app.router.router = router
  app.router.define = function (str) {
    return router.trie.define(str)
  }
  app.router.match = function (str) {
    return router.trie.match(str)
  }

  app.context.assertImplementsMethod = router.assertImplementsMethod()

  return app.router
}
