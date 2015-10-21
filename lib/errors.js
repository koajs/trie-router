
var errors = require('errors')

errors.create({
  name: 'MalformedUrl',
  defaultMessage: 'Attempted to match a malformed URL',
  code: 1101,
  scope: module.exports
})
