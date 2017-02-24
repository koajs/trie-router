/**
 * @param {*} any
 * @returns {Boolean}
 */
function isFunction(any) {
  return typeof any === 'function'
}
/**
 * @param {*} any
 * @returns {Boolean}
 */
function isString(any) {
  return typeof any === 'string'
}
/**
 * No operations
 */
function noop() {
}
/**
 * @param {*} any
 * @returns {Boolean}
 */
let {isArray} = Array

exports.isArray = isArray
exports.isFunction = isFunction
exports.isString = isString
exports.noop = noop