'use strict'

var extend = require('xtend')
var semver = require('semver')
var assert = require('assert')
var EventEmitter = require('events').EventEmitter
var ap = require('ap')
var series = require('run-series')
var npmSpawn = require('spawn-npm-install')
var spawn = require('child_process').spawn

module.exports = run

var defaults = {
  // npm script
  npm: false,
  // options passed to any child_process
  child_process: {},
  // quit as soon as we get a script failure
  bail: false
}

function run (options, callback) {
  options = extend(defaults, options)

  var name = options.name
  var command = options.command
  var versions = options.versions

  if (typeof name !== 'string') {
    throw new Error('package name is required')
  }

  if (typeof command !== 'string') {
    throw new Error('command is required')
  }

  if (options.npm) {
    command = 'npm run-script ' + command
  }

  var args = command.split(' ')
  command = args.shift()

  var events = new EventEmitter()

  series(versions.map(function (version) {
    return ap.partial(eachVersion, version)
  }), done)

  function done (err, results) {
    if (err) return callback(err)
    callback(null, results.map(function (passed, index) {
      return {
        passed: passed,
        version: versions[index]
      }
    }))
  }

  function eachVersion (version, callback) {
    series([install, script, uninstall].map(function (fn) {
      return ap.partial(fn, version)
    }), eachDone)
    function eachDone (err, results) {
      if (err) return callback(err)
      // we only care if the script passed
      callback(null, results[1])
    }
  }

  function install (version, callback) {
    function installDone (err) {
      if (err) return callback(err)
      callback(null)
      events.emit('postinstall', version)
    }
    var child = npmSpawn.install([name + '@' + version], options.child_process, installDone)
    events.emit('preinstall', version, child)
  }

  function script (version, callback) {
    var child = spawn(command, args, options.child_process)
    events.emit('prescript', version, child)
    child.once('exit', function (code) {
      // emit postscript first since error isn't always failure
      events.emit('postscript', version)
      var passed = code === 0
      events.emit('result', version, passed)
      if (passed) return callback(null, true)
      if (options.bail) return callback(new Error('Failed at ' + version))
      callback(null, false)
    })
  }

  function uninstall (version, callback) {
    function uninstallDone (err) {
      if (err) return callback(err)
      callback(null)
      events.emit('postuninstall', version)
    }
    var child = npmSpawn.uninstall(name, options.child_process, uninstallDone)
    events.emit('preuninstall', version, child)
  }
}

