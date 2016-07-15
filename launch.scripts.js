import fs from 'fs-promise'
import path from 'path'

const shell = module.parent.exports.shell

export default [ 'dist', 'test' ]

export const dist = [ 'lint', 'buildLib', 'buildSlave' ]
export const test = [ 'buildTests', 'testNode', 'testBrowser' ]

export async function buildLib () {
  await shell('babel src/ -d lib/ --source-maps')
  await createBrowserSlave('src/worker.browser/slave.js.txt', 'lib/worker.browser/slave-code.js')
  await shell('browserify lib/bundle.browser.js -o dist/threads.browser.js -r ./lib/worker.browser/worker.js:./worker -r ./lib/defaults.browser.js:./defaults')
  await shell('uglifyjs dist/threads.browser.js -c -m -o dist/threads.browser.min.js')
}

export async function buildSlave () {
  await shell('cp src/worker.browser/slave.js.txt dist/slave.js')
  await shell('uglifyjs dist/slave.js -c -m -o dist/slave.min.js')
}

export async function buildTests () {
  await shell('babel test/spec-src/ -d test/spec/')
}

export async function lint () {
  await shell('eslint -c .eslintrc src/**/*.js src/**/*.js.txt test/spec-src/*.js')
}

export async function testNode () {
  await shell('mocha test/spec/*.spec.js')
}

export async function testBrowser () {
  await shell('karma start karma.conf.js')
}

async function createBrowserSlave (inputFilePath, outputFilePath) {
  const fileContents = await fs.readFile(inputFilePath, { encoding: 'utf-8' })
  const newContents = 'module.exports = ' + JSON.stringify(fileContents) + ';'
  await fs.writeFile(outputFilePath, newContents, { encoding: 'utf-8' })
}
