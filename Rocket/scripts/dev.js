'use strict'

const path = require('path')
const childProcess = require('child_process')

// Webpack 4 on Node 17+ needs the legacy OpenSSL provider in child processes (WDS).
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--openssl-legacy-provider']
  .filter(Boolean)
  .join(' ')

// Electron rejects --openssl-legacy-provider in NODE_OPTIONS; strip it when spawning Electron.
const electronBinary = require('electron')
const originalSpawn = childProcess.spawn.bind(childProcess)

childProcess.spawn = function (command, args, options) {
  options = options || {}
  if (String(command) === String(electronBinary)) {
    const env = Object.assign({}, options.env || process.env)
    if (env.NODE_OPTIONS) {
      const filtered = env.NODE_OPTIONS
        .split(/\s+/)
        .filter((flag) => flag && flag !== '--openssl-legacy-provider')
        .join(' ')
      if (filtered) {
        env.NODE_OPTIONS = filtered
      } else {
        delete env.NODE_OPTIONS
      }
    }
    options = Object.assign({}, options, { env })
  }
  return originalSpawn(command, args, options)
}

process.argv = [
  process.argv[0],
  require.resolve('electron-webpack/out/cli.js'),
  'dev',
  ...process.argv.slice(2),
]

require('electron-webpack/out/cli.js')
