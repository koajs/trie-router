# Koa Trie Router

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gittip][gittip-image]][gittip-url]

## About

[Trie](http://en.wikipedia.org/wiki/Trie) routing for Koa based on [routington](https://github.com/jonathanong/routington).

Routes are orthogonal and strict, so the order of definition doesn't matter.  
Unlike regexp routing, there's no wildcard routing and you can't `next` to the next matching route.

See [routington](https://github.com/jonathanong/routington) for more details.

## Versions

+ **Koa@1** is compatible with `1.x.x` versions of Trie-router
+ **Koa@2** is compatible with `2.x.x` versions

## Features

+ Express-style routing using `router.get`, `router.put`, `router.post`, etc
+ Named URL parameters
+ Responds to `OPTIONS` requests with allowed methods
+ Multiple route middleware
+ Multiple routers
+ Nestable routers
+ `405 Method Not Allowed` support
+ `501 Not Implemented` support

## Usage

```js
const Koa = require('koa')
const Router = require('koa-trie-router')

let app = new Koa()
let router = new Router()

router
  .use(function(ctx, next) {
    console.log('* requests')
    return next()
  })
  .get(function(ctx, next) {
    console.log('GET requests')
    return next()
  })
  .put('/foo', function (ctx) {
    ctx.body = 'PUT /foo requests'
  })
  .post('/bar', function (ctx) {
    ctx.body = 'POST /bar requests'
  })

app.use(router.middleware())
app.listen(3000)
```

## API

### router.use(middleware...)
Handles all requests
```js
router.use(function(ctx) {
  ctx.body = 'test' // All requests
})
```

### router\[method\](middleware...)
Handles requests only by one HTTP method
```js
router.get(function(ctx) {
  ctx.body = 'GET' // GET requests
})
```

### router\[method\]\(paths, middleware...\)
Handles requests only by one HTTP method and one route

Where 
+ `paths` is `{String|Array<String>}`
+ `middleware` is `{Function|Array<Function>|AsyncFunction|Array<AsyncFunction>}`

Signature
```js
router
  .get('/one', middleware)
  .post(['/two','/three'], middleware)
  .put(['/four'], [middleware, middleware])
  .del('/five', middleware, middleware, middleware)
```

### router.middleware()

Like Express, all routes belong to a single middleware.
  
You can use `koa-mount` for mounting of multiple routers:
```js
const Koa = require('koa')
const mount = require('koa-mount')
const Router = require('koa-trie-router')

let app = new Koa()
let router1 = new Router()
let router2 = new Router()

router1.get('/foo', middleware)
router2.get('/bar', middleware)

app.use(mount('/foo', router1.middleware()))
app.use(mount('/bar', router2.middleware()))
```

### router.isImplementedMethod(method)

Checks if the server implements a particular method and returns `true` or `false`.
This is not middleware, so you would have to use it in your own middleware.

```js
app.use(function(ctx, next) {
  if (!router.isImplementedMethod(ctx.method)) {
    ctx.status = 501
    return
  }
  return next()
})
```


### ctx.params

`ctx.params` will be defined with any matched parameters.

```js
router.get('/user/:name', async function (ctx, next) {
  let name = ctx.params.name
  let user = await User.get(name)
  next()
})
```

### Error handling

The middleware throws an error with `code` _MALFORMEDURL_ when it encounters
a malformed path. An application can _try/catch_ this upstream, identify the error
by its code, and handle it however the developer chooses in the context of the
application- for example, re-throw as a 404.

### Path Definitions

For path definitions, see [routington](https://github.com/jonathanong/routington).


[npm-image]: https://img.shields.io/npm/v/koa-trie-router.svg?style=flat
[npm-url]: https://npmjs.org/package/koa-trie-router
[travis-image]: https://img.shields.io/travis/koajs/trie-router.svg?style=flat
[travis-url]: https://travis-ci.org/koajs/trie-router
[coveralls-image]: https://img.shields.io/coveralls/koajs/trie-router.svg?style=flat
[coveralls-url]: https://coveralls.io/r/koajs/trie-router?branch=master
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat
[gittip-url]: https://www.gittip.com/jonathanong/
