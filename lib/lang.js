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
function isObject(any) {
  return null !== any && typeof any === 'object'
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
/* istanbul ignore next */
function noop() {
}
/**
 * @param {*} any
 * @returns {Boolean}
 */
let {isArray} = Array

exports.isArray = isArray
exports.isFunction = isFunction
exports.isObject = isObject
exports.isString = isString
exports.noop = noop