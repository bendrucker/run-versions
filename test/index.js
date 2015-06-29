'use strict'

var test = require('tape')
var fs = require('fs')
var run = require('../')

test(function (t) {
  t.plan(7)
  var logPath = __dirname + '/log'
  var config = {
    name: 'has-require',
    versions: ['1.0.0', '1.1.0'],
    command: 'sh test/log.sh'
  }
  run(config, done)
  function done (err, results) {
    if (err) return t.end(err)
    t.equal(results.length, 2)
    results.forEach(function (result, index) {
      t.ok(result.passed)
      t.equal(result.version, config.versions[index])
    })
    var log = fs.readFileSync(logPath).toString()
    var items = log.replace(/\s+$/, '').split('\n\n').map(JSON.parse)
    t.equal(items.length, 2)
    t.deepEqual(items.map(function (item) {
      return item.dependencies['has-require'].version
    }), config.versions)
    fs.unlinkSync(logPath)
  }
})
