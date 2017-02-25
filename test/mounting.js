
const AssertRequest = require('assert-request')
const Koa = require('koa')
const mount = require('koa-mount')
const Router = require('..')


describe('mounting', function () {
  let app = new Koa()
  let router1 = new Router()
  let router2 = new Router()
  let request = AssertRequest(app.listen()); // You can use a server or protocol and host

  function middleware(ctx) {
    ctx.status = 204;
  }

  router1.get('/foo', middleware)
  router2.get('/bar', middleware)

  app.use(mount('/foo', router1.middleware()))
  app.use(mount('/bar', router2.middleware()))

  it('should work /foo/foo', function () {
    return request
      .get('/foo/foo')
      .status(204)
  })
  it('should work /bar/bar', function () {
    return request
      .get('/bar/bar')
      .status(204)
  })
})