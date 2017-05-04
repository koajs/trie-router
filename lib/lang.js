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
 * @param {*} any
 * @returns {Boolean}
 */
function isUndefined(any) {
  return undefined === any
}
/**
 * No operations
 */
/* istanbul ignore next */
function noop() {
}

exports.isFunction = isFunction
exports.isObject = isObject
exports.isString = isString
exports.isUndefined = isUndefined
exports.noop = noop