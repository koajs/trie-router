
const AssertRequest = require('assert-request')
const assert = require('assert')
const methods = require('methods')
const Koa = require('koa')
const Router = require('..')


let app
let server
let router
let request

function prepare(done) {
  app = new Koa()
  router = new Router()
  server = app.listen(done)
  request = AssertRequest(server)
  app.use(router.middleware())
}

function clean(done) {
  server.close(done)
}


function next(ctx, next) {
  next()
}


describe('public methods', function () {
  before(prepare)
  after(clean)

  it('should have all the methods defined', function () {
    for(let method of methods) {
      router[method].should.be.a.Function
    }
    router.del.should.be.a.Function
  })
  it('should have use() method', function () {
    router.use.should.be.a.Function
  })
})


describe('router.use()', function () {
  beforeEach(prepare)
  afterEach(clean)

  it('should work with any http method', function () {
    router.use(function (ctx) {
      ctx.status = 204
    })
    return request
      .get('/')
      .status(204)
  })
  it('should support chaining', function () {
    router
      .use(next)
      .use(function (ctx) {
        ctx.status = 204
      })
    return request
      .get('/')
      .status(204)
  })
  it('should work with multiple middleware', function () {
    router.use(function (ctx, next) {
      ctx.status = 202
      next()
    })
    router.use(function (ctx, next) {
      ctx.status += 1
      next()
    })
    router.use(function (ctx) {
      ctx.status += 1
    })
    return request
      .get('/')
      .status(204)
  })
  it('should working with ctx.params if middleware with params were defined', function () {
    router.use(function (ctx) {
      ctx.params.a.should.equal('one')
      ctx.params.b.should.equal('two')
      ctx.status = 204
    })
    router.get('/:a(one)/:b(two)', next)

    return request
      .get('/one/two')
      .status(204)
  })
  it('should still have ctx.params with no matched params', function () {
    router.use(function (ctx) {
      ctx.params.should.eql({})
      ctx.status = 204
    })
    router.get('/asdfasdf', next)

    return request
      .get('/asdfasdf')
      .status(204)
  })
})


describe('router[method]()', function () {
  beforeEach(prepare)
  afterEach(clean)

  it('should work with if implemented', function () {
    router.get(function (ctx) {
      ctx.status = 204
    })
    return request
      .get('/')
      .status(204)
  })
  it('should work with multiple middleware', function () {
    router.get(function (ctx, next) {
      ctx.status = 202
      next()
    })
    router.get(function (ctx, next) {
      ctx.status += 1
      next()
    })
    router.get(function (ctx) {
      ctx.status += 1
    })
    return request
      .get('/one')
      .status(204)
  })
})


describe('router[method](path, [fn...])', function () {
  before(prepare)
  after(clean)

  describe('when use path in rote definition', function () {
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
  })

  describe('when working with ctx.params', function () {
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

    it('should still have ctx.params with no matched params', function () {
      router.get('/asdfasdf', function (ctx) {
        ctx.params.should.eql({})
        ctx.status = 204
      })

      return request
        .get('/asdfasdf')
        .status(204)
    })
  })

  describe('when working with next()', function () {
    it('next() should be a function', function () {
      router.get('/', function (ctx, next) {
        next.should.be.a.Function
      })
    })
  })

  describe('when define nested middleware', function () {
    it('should work', function () {
      router.get('/two', next, [next, next], function (ctx) {
        ctx.status = 204
      })
      return request
        .get('/two')
        .status(204)
    })
  })

  describe('when defining same route few times', function () {
    it('should work', function () {
      router.get('/three', function (ctx, next) {
        ctx.status = 202
        next()
      })
      router.get('/three', function (ctx, next) {
        ctx.status += 1
        next()
      })
      router.get('/three', function (ctx) {
        ctx.status += 1
      })
      return request
        .get('/three')
        .status(204)
    })
  })

  describe('when defining nested routes', function () {
    it('the first should work', function () {
      router.get(['/stack/one', ['/stack/two', '/stack/three']], function (ctx) {
        ctx.status = 204
      })
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
})


describe('router methods', function () {
  beforeEach(prepare)
  afterEach(clean)

  it('order of definition does not matter', function () {
    router.get('/three', function (ctx) {
      ctx.state.x.should.be.equal(2)
      ctx.status = 204
    })
    router.get(function (ctx, next) {
      ctx.state.x.should.be.equal(1)
      ctx.state.x += 1;
      next()
    })
    router.use(function (ctx, next) {
      assert(ctx.state.x === undefined)
      ctx.state.x = 1
      next()
    })
    return request
      .get('/three')
      .status(204)
  })
})


describe('404', function(){
  before(prepare)
  after(clean)

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
  beforeEach(prepare)
  afterEach(clean)

  it('should 404 for uncaught malformed url', function () {
    router.get('/', function (ctx) {
      ctx.status = 204
    })
    return request
      .get('/%')
      .status(404)
  })

  it('should throw catchable error for malformed url', function () {
    // Error handler should be set before a middleware which throws a error
    app.middleware.unshift(async function (ctx, next) {
      try {
        await next()
      } catch (e) {
        if (e.code == 'MALFORMEDURL') {
          ctx.body = 'malformed URL'
        }
      }
    })
    router.get('/', function (ctx) {
      ctx.status = 204
    })

    return request
      .get('/%%')
      .body('malformed URL')
  })
})


describe('regressions', function () {
  before(prepare)
  after(clean)
  describe('should not 404 with child routes', function () {
    it('should work /a', function () {
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


