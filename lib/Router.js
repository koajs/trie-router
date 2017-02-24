

const assert = require('assert')
const flatten = require('flatten')
const Routington = require('routington')
const methods = require('methods')
const compose = require('koa-compose')
const {
  isArray,
  isFunction,
  isString,
  noop
} = require('./lang')


const __MIDDLEWARE = Symbol()
const __ADD_ROUTE = Symbol()


class Router {
  /**
   *
   */
  constructor() {
    this.methods = {
      OPTIONS: true
    }
    this.routes = []
    this.trie = Routington()
    this.loadRoutes()
  }
  /**
   * @param {String} method
   * @param {String|Array<String>} paths
   * @param {...Function} middleware
   * @returns {Router}
   */
  addRoute(method, paths, ...middleware) {
    this[__ADD_ROUTE](method, paths, middleware)
    return this
  }
  /**
   * @param {String} method
   * @returns {Boolean}
   */
  isImplementedMethod(method) {
    return this.methods.hasOwnProperty(method);
  }
  /**
   *
   */
  loadRoutes() {
    for(let method of methods) {
      this[method] = this.addRoute.bind(this, method)
    }
    this.del = this.delete
  }
  /**
   * @returns {Function}
   */
  middleware() {
    return this[__MIDDLEWARE].bind(this)
  }
  /**
   * @param {String} method
   * @param {String|Array<String>} paths
   * @param middleware
   */
  [__ADD_ROUTE](method, paths, middleware) {
    let nodes = [];

    paths = isArray(paths) ? paths : [paths]
    paths = flatten(paths).filter(Boolean)

    assert(paths.length, 'Route must have a path')

    for(let path of paths) {
      assert(isString(path), 'Paths must be strings: ' + path)
      assert(path[0] === '/', 'Paths must start with a "/": ' + path)
      for(let node of this.trie.define(path)) {
        if (!nodes.includes(node)) {
          nodes.push(node)
        }
      }
    }

    assert(nodes.length, 'No routes defined. Something went wrong.')

    let implementedMethods = this.methods
    let methodUppercase = method.toUpperCase();

    // For 501 Not Implemented support
    implementedMethods[methodUppercase] = true
    if (methodUppercase === 'GET') {
      implementedMethods.HEAD = true
    }

    // Take out all the falsey middleware
    let stack = flatten(middleware).filter(Boolean).filter(assertFunction)

    if (!stack.length) {
      return
    }

    for(let node of nodes) {
      // Push the functions to the function stack
      node[method] = isArray(node[method]) ? node[method] : []
      node[method] = node[method].concat(stack)
      // Builds the list of supported methods for this route
      // for OPTIONS and 405 responses
      node.methods = methods
        .filter(mth => Boolean(node[mth]))
        .map(mth => mth.toUpperCase())
      if (node.methods.includes('GET') && !node.methods.includes('HEAD')) {
        node.methods.push('HEAD')
      }
      if (!node.methods.includes('OPTIONS')) {
        node.methods.push('OPTIONS')
      }
      node.methods = node.methods.join(',')
      // Builds the actual composed generator
      node[methodUppercase] = node[method].length > 1
        ? compose(node[method])
        : node[method][0]
    }

    this.routes.push(nodes)
  }
  /**
   * @param {Object} ctx
   * @param {Function} next
   */
  [__MIDDLEWARE](ctx, next) {
    let match

    try {
      match = this.trie.match(ctx.request.path)
    } catch (err) {
      err.code = 'MALFORMEDURL'
      throw err
    }
    let node = match && match.node
    // If no route match or no methods are defined, go to next middleware
    // TODO: make node.methods more well-defined
    if (!node || !node.methods) {
      return next()
    }

    // If no HEAD middleware, default to GET.
    let method = ctx.method
    if (method === 'HEAD' && !node.HEAD) {
      method = 'GET'
    }

    // OPTIONS support
    if (method === 'OPTIONS') {
      ctx.response.status = 204
      ctx.response.set('Allow', node.methods)
      return
    }

    // If no function is returned
    // it's a 405 error
    let fn = node[method]
    if (!fn) {
      ctx.response.set('Allow', node.methods)
      ctx.response.status = 405
      return
    }

    ctx.params = ctx.request.params = match.param
    return fn(ctx, noop)
  }
}


/**
 * @param {Function} fn
 * @returns {Function}
 */
function assertFunction(fn) {
  assert(isFunction(fn), 'all middleware must be functions')
  return fn
}

module.exports = Router