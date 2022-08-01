'use strict'

const test = require('tape')
const fs = require('fs')
const path = require('path')
const run = require('../')

test(function (t) {
  t.plan(8)
  const logPath = path.resolve(__dirname, 'log')
  const config = {
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
    const log = fs.readFileSync(logPath).toString()
    const items = log.replace(/\s+$/, '').split('\n\n').map(JSON.parse)
    t.equal(items.length, 2)
    t.deepEqual(items.map(function (item) {
      return item.version
    }), config.versions)
    t.ok(require('./package.json').peerDependencies, 'peer dependencies should be preserved')
    fs.unlinkSync(logPath)
  }
})
