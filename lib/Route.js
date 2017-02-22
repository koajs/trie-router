

const assert = require('assert')
const flatten = require('flatten')
const methods = require('methods')
const compose = require('koa-compose')
const {
  isArray,
  isFunction,
  isString
} = require('./lang');


class Route {
  /**
   * @param {Router} router
   * @param {String|Array<String>} paths
   */
  constructor(router, paths) {
    this.router = router
    this.nodes = []

    paths = isArray(paths) ? paths : [paths]
    paths = flatten(paths).filter(Boolean)

    assert(paths.length, 'Route must have a path')

    for(let path of paths) {
      assert(isString(path), 'Paths must be strings: ' + path)
      assert(path[0] === '/', 'Paths must start with a "/": ' + path)
      for(let node of router.trie.define(path)) {
        if (!this.nodes.includes(node)) {
          this.nodes.push(node)
        }
      }
    }

    assert(this.nodes.length, 'No routes defined. Something went wrong.')
  }
  /**
   * @param {String} method
   * @param {...Function} functions
   */
  append(method, ...functions) {
    let implementedMethods = this.router.methods
    let methodUppercase = method.toUpperCase();

    // For 501 Not Implemented support
    implementedMethods[methodUppercase] = true
    if (methodUppercase === 'GET') {
      implementedMethods.HEAD = true
    }

    // Take out all the falsey middleware
    let stack = flatten(functions).filter(Boolean).filter(assertFunction)

    if (!stack.length) {
      return
    }

    for(let node of this.nodes) {
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


module.exports = Route;