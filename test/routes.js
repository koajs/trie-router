var METHODS = require('methods').map(function (method) {
  return method.toUpperCase()
})
var request = require('supertest')
var assert = require('assert')
var koa = require('koa')

var router = require('..')
var errors = require('../lib/errors')

var app = koa()

app.use(router(app))

var server = app.listen()

describe('app[method]()', function () {
  it('should work', function (done) {
    app.get('/home', function* (next) {
      this.status = 204
    })

    request(server)
    .get('/home')
    .expect(204, done)
  })

  it('should throw on non-gen-funs', function () {
    assert.throws(function () {
      app.get('/home', function () {})
    })
  })

  it('should match params', function (done) {
    app.get('/:a(one)/:b(two)', function* (next) {
      this.params.a.should.equal('one')
      this.params.b.should.equal('two')
      this.status = 204
    })

    request(server)
    .get('/one/two')
    .expect(204, done)
  })

  it('should still have this.params with no matched params', function (done) {
    app.get('/asdfasdf', function* (next) {
      this.params.should.eql({})
      this.status = 204
    })

    request(server)
    .get('/asdfasdf')
    .expect(204, done)
  })

  it('should have all the methods defined', function () {
    METHODS.forEach(function (method) {
      app[method.toLowerCase()].should.be.a.Function
    })

    app.del.should.be.a.Function
  })

  describe('when defining nested routes', function () {
    app.get(['/stack/one', ['/stack/two', '/stack/three']], function* (next) {
      this.status = 204
    })

    it('the first should work', function (done) {
      request(server)
      .get('/stack/one')
      .expect(204, done)
    })

    it('the second should work', function (done) {
      request(server)
      .get('/stack/two')
      .expect(204, done)
    })

    it('the third should work', function (done) {
      request(server)
      .get('/stack/three')
      .expect(204, done)
    })
  })

  describe('when defining nested middleware', function (done) {
    app.get('/two', noop, [noop, noop], function* (next) {
      this.status = 204
    })

    request(server)
    .get('/two')
    .expect(204, done)
  })
})

describe('app.route()', function () {
  it('should work', function (done) {
    app.route('/something').get(function* (next) {
      this.status = 204
    })

    request(server)
    .get('/something')
    .expect(204, done)
  })

  it('should have all the methods defined', function () {
    var route = app.route('/kajsdlfkjasldkfj')

    METHODS.forEach(function (method) {
      route[method.toLowerCase()].should.be.a.Function
    })

    route.del.should.be.a.Function
  })

  describe('when defining nested routes', function () {
    app
    .route(['/stack2/one', ['/stack2/two', '/stack2/three']])
    .get(function* (next) {
      this.status = 204
    })

    it('the first should work', function (done) {
      request(server)
      .get('/stack2/one')
      .expect(204, done)
    })

    it('the second should work', function (done) {
      request(server)
      .get('/stack2/two')
      .expect(204, done)
    })

    it('the third should work', function (done) {
      request(server)
      .get('/stack2/three')
      .expect(204, done)
    })
  })

  describe('when defining nested middleware', function (done) {
    app
    .route('/monkey')
    .get(noop, [noop, noop], function* (next) {
      this.status = 204
    })

    request(server)
    .get('/monkey')
    .expect(204, done)
  })
})

describe('404', function(){
  it('should 404 when not matched', function (done) {
    request(server)
    .get('/asdf')
    .expect(404, done)
  })

  it('should 404 when not matched w/ superior route', function (done) {
    app
    .get('/app/home', function* (next) {
      this.status = 204;
    })

    request(server)
    .get('/app')
    .expect(404, done)
  })
})

it('should throw for malformed url', function (done) {
  app.get('/', function* (next) {
    this.status = 204
  })

  request(server)
  .get('/%')
  .expect(500, done)
})

describe('regressions', function () {
  it('should not 404 with child routes', function (done) {
    app
    .get('/a', function* () {
      this.response.status = 204;
    })
    .get('/a/b', function* () {
      this.response.status = 204;
    })
    .get('/a/b/c', function* () {
      this.response.status = 204;
    })

    request(server)
    .get('/a')
    .expect(204, function (err, res) {
      assert.ifError(err);

      request(server)
      .get('/a/b')
      .expect(204, function (err, res) {
        assert.ifError(err);

        request(server)
        .get('/a/b/c')
        .expect(204, done);
      })
    })
  })
})

function* noop(next) {
  yield* next
}
