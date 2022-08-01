'use strict'

const extend = require('xtend')
const EventEmitter = require('events').EventEmitter
const ap = require('ap')
const series = require('run-series')
const npmSpawn = require('spawn-npm-install')
const spawn = require('child_process').spawn

module.exports = run

const defaults = {
  // npm script
  npm: false,
  // options passed to any child_process
  child_process: {},
  // quit as soon as we get a script failure
  bail: false
}

function run (options, callback) {
  options = extend(defaults, options)

  const name = options.name
  let command = options.command
  const versions = options.versions

  if (typeof name !== 'string') {
    throw new Error('package name is required')
  }

  if (typeof command !== 'string') {
    throw new Error('command is required')
  }

  if (options.npm) {
    command = 'npm run-script ' + command
  }

  const args = command.split(' ')
  command = args.shift()

  const events = new EventEmitter()

  series(versions.map(function (version) {
    return ap.partial(eachVersion, version)
  }), done)

  return events

  function done (err, results) {
    if (err) return callback(err)
    callback(null, results.map(function (passed, index) {
      return {
        passed,
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
    const child = npmSpawn.install([
      name + '@' + version,
      '--no-save'
    ], options.child_process, installDone)
    events.emit('preinstall', version, child)
  }

  function script (version, callback) {
    const child = spawn(command, args, options.child_process)
    events.emit('prescript', version, child)
    child.once('exit', function (code) {
      // emit postscript first since error isn't always failure
      events.emit('postscript', version)
      const passed = code === 0
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
    const child = npmSpawn.uninstall([name, '--no-save'], options.child_process, uninstallDone)
    events.emit('preuninstall', version, child)
  }
}
