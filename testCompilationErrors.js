/**
 * @author AlexGalays
 */
const ts = require('typescript')
const {forEach, last} = require('ramda')
const chalk = require('chalk')
const fs = require('fs')
const glob = require('glob-promise')
const path = require('path')

const tsOptions = {noImplicitAny: false, noEmit: true, strict: true, target: 'es5'}

const lib = require('./config/base/tsconfig.json').compilerOptions.lib

glob(path.resolve(__dirname, 'src/*.shouldNotCompile.ts')).then(forEach(testFileForCompilationErrors))

const libPaths = lib.map(lib => 'node_modules/typescript/lib/lib.' + lib + '.d.ts')

function testFileForCompilationErrors(path) {
   const fileName = last(path.split('/'))
   console.log(chalk.blue('Testing compilation errors in "' + fileName + '" :'))
   const expectedErrorCount = (fs.readFileSync(path, 'utf8').match(/@shouldNotCompile/g) || []).length
   const program = ts.createProgram([...libPaths, path], tsOptions)
   const diagnostics = ts.getPreEmitDiagnostics(program)
   if (diagnostics.length === expectedErrorCount) {
      console.log(chalk.green('All the expected compilation errors were found'))
   }
   else {
      const lines = errors(diagnostics).map(d => d.line).join(', ')
      console.log(chalk.red(`${expectedErrorCount} errors were expected but ${diagnostics.length} errors were found at these lines: ${lines}`))
   }
}

function errors(arr) {
   // console.log(arr.filter(diag => diag.file.path !== shouldNotCompileFilePath).map(diag => diag.file.path + ', line ' + diag.file.getLineAndCharacterOfPosition(diag.start).line + ', message: ' + diag.messageText))
   console.log(arr.map(diag => diag.file.path + ', line ' + diag.file.getLineAndCharacterOfPosition(diag.start).line + ', message: ' + diag.messageText))
   return arr.map(diag => ({line: diag.file.getLineAndCharacterOfPosition(diag.start).line + 1}))
}
