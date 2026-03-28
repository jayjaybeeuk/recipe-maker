// Pre-setup: patch Node.js module resolver to redirect react-native to a
// Flow-free mock. This runs before vitest.setup.ts so the mock is in place
// when @testing-library/jest-native loads react-native.
'use strict'

const Module = require('module')
const path = require('path')

const mockPath = path.resolve(__dirname, 'test-utils/react-native-mock.js')
const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'react-native') {
    return mockPath
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}
