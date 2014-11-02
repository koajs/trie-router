
var compose = require('koa-compose')
var isGenFun = require('is-gen-fn')
var flatten = require('flatten')
var assert = require('assert')
var METHODS = require('methods').map(function (method) {
  return method.toUpperCase()
})

var Router = require('./router')

Router.prototype.routes = function () {
  var router = this
  var app = this.app

  // app.route(paths).get(gen).post(gen)
  app.route = function () {
    return new Route(router, [].slice.call(arguments))
  }

  // app.get(paths, gen, gen ,gen)
  METHODS.forEach(function (method) {
    app[method.toLowerCase()] = function (paths) {
      new Route(router, paths)
        ._append(method, [].slice.call(arguments, 1))

      return app
    }
  })

  app.del = app.delete
}

function Route(router, paths) {
  this.router = router

  if (!Array.isArray(paths)) paths = [paths]
  paths = flatten(paths).filter(Boolean)

  var nodes = this.nodes = []

  assert(paths.length, 'Route must have a path')

  paths.forEach(function (path) {
    assert(typeof path === 'string', 'Paths must be strings: ' + path)
    assert(path[0] === '/', 'Paths must start with a "/": ' + path)
    router.trie.define(path).forEach(function (node) {
      if (!~nodes.indexOf(node)) nodes.push(node)
    })
  })

  assert(nodes.length, 'No routes defined. Something went wrong.')
}

Route.prototype._append = function (method, generators) {
  var implementedMethods = this.router.methods
  var _method = method.toLowerCase()

  // For 501 Not Implemented support
  implementedMethods[method] = true
  if (method === 'GET') implementedMethods.HEAD = true

  // Take out all the falsey middleware
  var stack = flatten(generators).filter(Boolean).filter(assertGenFun)
  if (!stack.length) return

  this.nodes.forEach(function (node) {
    // Push the generators to the generator stack
    node[_method] = (node[_method] || []).concat(stack)

    // Builds the list of supported methods for this route
    // for OPTIONS and 405 responses
    node.methods = METHODS.filter(function (method) {
      return node[method.toLowerCase()]
    })
    if (~node.methods.indexOf('GET') && !~node.methods.indexOf('HEAD'))
      node.methods.push('HEAD')
    if (!~node.methods.indexOf('OPTIONS'))
      node.methods.push('OPTIONS')
    node.methods = node.methods.join(',')

    // Builds the actual composed generator
    node[method] = node[_method].length > 1
      ? compose(node[_method])
      : node[_method][0]
  })
}

Router.prototype.end = function () {
  return this.router.app
}

// For `app.get(path, gen, gen, gen)` support
METHODS.forEach(function (method) {
  Route.prototype[method.toLowerCase()] = function () {
    this._append(method, flatten([].slice.call(arguments)))
    return this
  }
})

Route.prototype.del = Route.prototype.delete

function assertGenFun(fn) {
  assert(isGenFun(fn), 'all middleware must be generator functions')
  return fn
}
