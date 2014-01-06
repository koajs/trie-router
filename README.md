# Koa Trie Router [![Build Status](https://travis-ci.org/koajs/trie-router.png)](https://travis-ci.org/koajs/trie-router)

[Trie](http://en.wikipedia.org/wiki/Trie) routing for Koa based on [routington](https://github.com/jonathanong/routington).

## Features

- `OPTIONS` support
- `405 Method Not Allowed` support
- `501 Not Implemented` support

Routes are generally orthogonal, so the order of definition generally doesn't matter.
See [routington](https://github.com/jonathanong/routington) for more details.

## Installation

```js
var app = require('koa')()
app.use(require('koa-trie-router')(app))

app.route('/')
.get(function* (next) {
  this.body = 'homepage'
})

app.post('/images', function* (next) {
  var image = yield* this.request.buffer('25mb')
})
```

## API

### this.assertImplementsMethod()

Checks if the server implements a particular method and throws a `501` error otherwise.
This is not middleware, so you would have to use it in your own middleware.

```js
app.use(myCustomErrorHandler)

app.use(function* (next) {
  this.request.assertImplementsMethod() // throws otherwise
  yield next
})
```

### app.use(app.router)

Like Express, all routes belong to a single middleware.
Unlike Express, `app.router` is not implicitly mounted.
If you do not do `app.use(app.router)` ever,
routing will never work.

### app.route(paths)\[method\]\(middleware...\)

`paths` can be a nested stack of string paths:

```js
app.route('/one', [
  '/two',
  ['/three', '/four']
])
```

You can then chain `[method](middleware...)` calls.

```js
app.route('/')
.get(function* (next) {

})
.post(function* (next) {

})
.patch(function* (next) {

})
```

### app\[method\]\(paths, middleware...\)

Similar to above, but you define `paths` as the first argument:

```js
app.get([
  '/one',
  '/two'
], function* (next) {

})
```

### this.params

`this.params` will be defined with any matched parameters.

```js
app.get('/user/:name', function* (next) {
  var name = this.params.name
  var user = yield User.get(name)
  yield next
})
```

### Path Definitions

For path definitions, see [routington](https://github.com/jonathanong/routington).

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.