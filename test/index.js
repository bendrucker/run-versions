'use strict'

var test = require('tape')
var fs = require('fs')
var path = require('path')
var run = require('../')

test(function (t) {
  t.plan(8)
  var logPath = path.resolve(__dirname, 'log')
  var config = {
    name: 'has-require',
    versions: ['1.0.0', '1.1.0'],
    command: 'sh log.sh',
    child_process: {
      cwd: __dirname
    }
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
      return item.version
    }), config.versions)
    t.ok(require('./package.json').peerDependencies, 'peer dependencies should be preserved')
    fs.unlinkSync(logPath)
  }
})
