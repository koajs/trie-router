

const assert = require('assert')
const flatten = require('flatten')
const Routington = require('routington')
const methods = require('methods')
const compose = require('koa-compose')
const Methods = require('./Methods')
const {
  isArray,
  isFunction,
  isObject,
  isString,
  noop
} = require('./lang')


const __MIDDLEWARE = Symbol()
const __BOTTOM_MIDDLEWARE = Symbol()
const __ADD_ROUTE = Symbol()
const __PARSE_PATHS = Symbol()


const NODE_GAG = {
  methods: new Methods(),
  isGag: true
}


class Router {
  /**
   *
   */
  constructor() {
    this.methods = new Methods([
      ['OPTIONS']
    ])
    this.trie = Routington()
    this.loadRoutes()
  }
  /**
   * @param {String} method
   * @param {String|Array<String>} paths
   * @param {...Function} [middleware]
   * @returns {Router}
   */
  addRoute(method, paths, ...middleware) {
    if (isFunction(paths) || (isArray(paths) && isFunction(paths[0]))) {
      middleware.push(...flatten([paths]))
      this[__ADD_ROUTE](method, undefined, middleware)
    } else {
      this[__ADD_ROUTE](method, paths, middleware)
    }
    return this
  }
  /**
   * @param {String} method
   * @returns {Boolean}
   */
  isImplementedMethod(method) {
    return this.methods.has(method);
  }
  /**
   *
   */
  loadRoutes() {
    for(let method of methods) {
      this[method] = this.addRoute.bind(this, method.toUpperCase())
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
   * @param {...Function} middleware
   * @returns {Router}
   */
  use(...middleware) {
    return this.addRoute('ANY', middleware)
  }
  /**
   * @param {String} method
   * @param {String|Array<String>} paths
   * @param {Function|Array<Function>} middleware
   */
  [__ADD_ROUTE](method, paths, middleware) {
    // Take out all the falsey middleware
    let stack = flatten(middleware).filter(Boolean)
    stack.forEach(assertFunction)

    /* istanbul ignore if */
    if (!stack.length) {
      return
    }

    if (method === 'ANY' || !paths) {
      this.methods.add(method, stack)
      return
    }

    // For 501 Not Implemented support
    this.methods.add(method)
    if (method === 'GET') {
      this.methods.add('HEAD')
    }

    let nodes = this[__PARSE_PATHS](paths);

    for(let node of nodes) {
      // Push the functions to the function stack
      // and build the list of supported methods for this route
      // for OPTIONS and 405 responses
      node.methods.add(method, stack)
      if (node.methods.has('GET')) {
        node.methods.add('HEAD')
      }
    }
  }
  /**
   * @param {String|Array<String>} paths
   * @returns {Array}
   */
  [__PARSE_PATHS](paths) {
    let nodes = []

    paths = isArray(paths) ? paths : [paths]
    paths = flatten(paths).filter(Boolean)

    assert(paths.length, 'Route must have a path')

    for(let path of paths) {
      assert(isString(path), 'Paths must be strings: ' + path)
      assert(path[0] === '/', 'Paths must start with a "/": ' + path)
      for(let node of this.trie.define(path)) {
        if (!nodes.includes(node)) {
          node.methods = node.methods || new Methods([['OPTIONS']])
          nodes.push(node)
        }
      }
    }

    assert(nodes.length, 'No routes defined. Something went wrong.')

    return nodes
  }
  /**
   * @param {Object} ctx
   * @param {Function} next
   * @return {Promise}
   */
  [__MIDDLEWARE](ctx, next) {
    let {method} = ctx

    // OPTIONS support
    if (method === 'OPTIONS') {
      ctx.response.status = 204
      ctx.response.set('Allow', this.methods.toString())
      return
    }

    let match
    try {
      match = this.trie.match(ctx.request.path)
    } catch (err) {
      err.code = 'MALFORMEDURL'
      throw err
    }

    let isMatched = isObject(match)
    let node = isMatched ? match.node : NODE_GAG
    node.methods = node.methods || NODE_GAG.methods
    ctx.params = ctx.request.params = isMatched ? match.param : {}

    let top = getMiddleware(this.methods, 'ANY')     // router.use(fn)
    let middle = getMiddleware(this.methods, method) // router[method](fn)
    let bottom = getMiddleware(node.methods, method) // router[method](path, fn)

    let stack = [...top, ...middle, this[__BOTTOM_MIDDLEWARE].bind(this, ctx, next, bottom, node)]

    let fn = compose(stack)
    return fn(ctx, noop)
  }
  /**
   * @param {Object} ctx
   * @param {Function} next
   * @param {Array<Function>} middleware
   * @param {Object} node
   * @returns {Promise}
   */
  [__BOTTOM_MIDDLEWARE](ctx, next, middleware, node) {
    // If no route match or no methods are defined, go to next middleware
    if (node.isGag || !node.methods.size) {
      return next()
    }
    // If there is no one middleware
    // it's a 405 error
    if (!middleware.length) {
      ctx.response.set('Allow', this.methods.toString())
      ctx.response.status = 405
      return
    }

    let fn = compose(middleware)
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
/**
 * @param {Methods} methods
 * @param {String} method
 * @returns {Array<Function>}
 */
function getMiddleware(methods, method) {
  if (method === 'HEAD') {
    return methods.hasMiddleware('HEAD') ? methods.get('HEAD') : methods.get('GET')
  }
  return methods.get(method)
}


module.exports = Router