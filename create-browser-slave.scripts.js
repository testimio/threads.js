import fs from 'fs-promise'
import path from 'path'

export default async function () {
  await createBrowserSlave('src/worker.browser/slave.js.txt', 'lib/worker.browser/slave-code.js')
}

async function createBrowserSlave (inputFilePath, outputFilePath) {
  const fileContents = await fs.readFile(inputFilePath, { encoding: 'utf-8' })
  const newContents = 'module.exports = ' + JSON.stringify(fileContents) + ';'
  await fs.writeFile(outputFilePath, newContents, { encoding: 'utf-8' })
}
