

const Routington = require('routington')
const methods = require('methods')
const Route = require('./Route')
const {noop} = require('./lang')


const __MIDDLEWARE = Symbol()


class Router {
  /**
   *
   */
  constructor() {
    this.methods = {
      OPTIONS: true
    }
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
    new Route(this, paths).append(method, middleware)
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


module.exports = Router