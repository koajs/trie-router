
const AssertRequest = require('assert-request')
const Koa = require('koa')
const Router = require('..')

let app = new Koa()
let router = new Router()
let request = AssertRequest(app.listen()); // You can use a server or protocol and host

app.use(function(ctx, next) {
  if (!router.isImplementedMethod(ctx.method)) {
    ctx.status = 501
    return
  }
  next()
})

router
  .get('/', function (ctx) {
    ctx.status = 204
  })
  .search('/kasdjflkajsdf', function (ctx) {
    ctx.status = 204
  })

app.use(router.middleware())


describe('router.isImplementedMethod()', function(){
  it('should return 501 if not implemented', function () {
    return request
    .patch('/')
    .status(501)
  })

  it('should not return 501 if implemented', function () {
    return request
    .get('/')
    .status(204)
  })
})

describe('OPTIONS', function(){
  it('should send Allow', function () {
    return request
    .options('/')
    .header('Allow', /\bGET\b/)
    .header('Allow', /\bHEAD\b/)
    .header('Allow', /\bOPTIONS\b/)
    .status(204)
  })
})

describe('405 Method Not Allowed', function(){
  it('should send Allow', function () {
    return request
    .search('/')
    .header('Allow', /\bGET\b/)
    .header('Allow', /\bHEAD\b/)
    .header('Allow', /\bOPTIONS\b/)
    .status(405)
  })
})

describe('HEAD', function(){
  it('should respond with GET if not defined', function () {
    return request
    .head('/')
    .status(204)
  })
})