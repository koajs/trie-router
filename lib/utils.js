exports.flatten = function flatten(arr, tmp) {
  if (!Array.isArray(arr))
    return [arr]

  tmp = tmp || []

  arr.forEach(function (x) {
    Array.isArray(x)
      ? flatten(x, tmp)
      : tmp.push(x)
  })

  return tmp
}