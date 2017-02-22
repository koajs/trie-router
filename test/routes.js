
const AssertRequest = require('assert-request')
const assert = require('assert')
const methods = require('methods')
const Koa = require('koa')
const Router = require('..')
const {noop} = require('./../lib/lang')

let app = new Koa()
let router = new Router()
let request = AssertRequest(app.listen()) // You can use a server or protocol and host


app.use(router.middleware())


describe('router[method]()', function () {
  it('should work', function () {
    router.get('/home', function (ctx) {
      ctx.status = 204
    })

    return request
      .get('/home')
      .status(204)
  })

  it('should throw on non-funs', function () {
    assert.throws(function () {
      app.get('/home', null)
    })
  })

  it('should match params', function () {
    router.get('/:a(one)/:b(two)', function (ctx) {
      ctx.params.a.should.equal('one')
      ctx.params.b.should.equal('two')
      ctx.status = 204
    })

    return request
      .get('/one/two')
      .status(204)
  })

  it('should still have this.params with no matched params', function () {
    router.get('/asdfasdf', function (ctx) {
      ctx.params.should.eql({})
      ctx.status = 204
    })

    return request
      .get('/asdfasdf')
      .status(204)
  })

  it('should have all the methods defined', function () {
    for(let method of methods) {
      router[method].should.be.a.Function
    }
    router.del.should.be.a.Function
  })

  describe('when defining nested routes', function () {
    router.get(['/stack/one', ['/stack/two', '/stack/three']], function (ctx) {
      ctx.status = 204
    })

    it('the first should work', function () {
      return request
        .get('/stack/one')
        .status(204)
    })

    it('the second should work', function () {
      return request
        .get('/stack/two')
        .status(204)
    })

    it('the third should work', function () {
      return request
        .get('/stack/three')
        .status(204)
    })
  })

  describe('when defining nested middleware', function () {
    router.get('/two', noop, [noop, noop], function (ctx) {
      ctx.status = 204
    })

    return request
      .get('/two')
      .status(204)
  })
})


describe('404', function(){
  it('should 404 when not matched', function () {
    return request
      .get('/asdf')
      .status(404)
  })

  it('should 404 when not matched w/ superior route', function () {
    router
      .get('/app/home', function (ctx) {
        ctx.status = 204;
      })

    return request
      .get('/app')
      .status(404)
  })
})


describe('malformed url', function () {
  it('should 404 for uncaught malformed url', function () {
    router.get('/', function (ctx) {
      ctx.status = 204
    })

    return request
      .get('/%')
      .status(404)
  })

  it('should throw catchable error for malformed url', function () {
    let app2 = new Koa()
    let router2 = new Router()
    let request2 = AssertRequest(app2.listen()) // You can use a server or protocol and host

    app2.use(async function (ctx, next) {
      try {
        await next()
      } catch (e) {
        if (e.code == 'MALFORMEDURL') {
          ctx.body = 'malformed URL'
        }
      }
    })
    router2.get('/', function (ctx) {
      ctx.status = 204
    })
    app2.use(router2.middleware())

    return request2
      .get('/%%')
      .body('malformed URL')
  })
})


describe('regressions', function () {
  describe('should not 404 with child routes', function () {
    router
      .get('/a', function (ctx) {
        ctx.status = 204;
      })
      .get('/a/b', function (ctx) {
        ctx.status = 204;
      })
      .get('/a/b/c', function (ctx) {
        ctx.status = 204;
      })

    it('should work /a', function () {
      return request
        .get('/a')
        .status(204)
    })
    it('should work /a/b', function () {
      return request
        .get('/a/b')
        .status(204)
    })
    it('should work /a/b/c', function () {
      return request
        .get('/a/b/c')
        .status(204)
    })
  })
})


