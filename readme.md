# run-versions [![Build Status](https://travis-ci.org/bendrucker/run-versions.svg?branch=master)](https://travis-ci.org/bendrucker/run-versions) [![Greenkeeper badge](https://badges.greenkeeper.io/bendrucker/run-versions.svg)](https://greenkeeper.io/)

> Run a script across multiple versions of an npm package

## Install

```
$ npm install --save run-versions
```


## Usage

```js
var run = require('run-versions')
run({
  name: 'xtend',
  command: 'npm ls xtend',
  versions: ['3.0.0', '4.0.0']
}, done)
//=> done(null, [{version: '3.0.0', passed: true}, {version: '4.0.0', passed: true}])
```

## API

#### `run(options, callback)` -> `eventEmitter`

Iterates through the supplied versions, running the specified shell command at each version. For details on events, see the [events documentation](#events).

##### options

*Required*  
Type: `object`

Configuration objects for the runner:

###### name

*Required*  
Type: `string`

The name of the package to install.

###### command

*Required*  
Type: `string`

The command to run on each version.

###### versions

*Required*  
Type: `array[string]`

Versions to install and run against.

###### npm

Type: `boolean`  
Default: `false`

Set to `true` to treat the command as an npm script.

###### child_process

Type: `object`  
Default: `{}`

Options to pass to [spawned child processes](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

###### bail

Type: `boolean`  
Default: `false`

Call the callback immediately with an error if any test fails.

##### callback

*Required*  
Type: `function`  
Arguments: `err, results`

A callback to be called when the run completes. Installation errors are considered fatal, while test errors are only fatal when `options.bail` is set. 

###### results

Type: `array[object]`

An array of objects with properties *version* (string) and *passed* (boolean) indicating test results. 

## Events

A script runner is an `EventEmitter` and emits various events during its lifecycle. These events are:

* preinstall
* postinstall
* prescript
* postscript
* result
* preuninstall
* postuninstall

All events receive the current version as the first argument. *pre* events receive the child process used to execute the installation/script/uninstallation as the second argument. The *result* event receives the test result (pass/fail) as the second argument. *post* events receive only one argument.

```js
run(config, callback)
  .on('postinstall', function (version) {
    console.log('Installed', version)
  })
  .on('prescript', function (version, child) {
    child.stdout.pipe(process.stdout)
  })
```

Note that you can use `{stdio: 'inherit'}` in the `child_process` option if you'd prefer to pass through all output (install and uninstall logs), not just the script. 

## License

MIT © [Ben Drucker](http://bendrucker.me)
