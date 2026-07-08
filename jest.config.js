const { pathsToModuleNameMapper } = require('ts-jest');
const { readFileSync } = require('fs');

const { compilerOptions } = JSON.parse(
  readFileSync('./tsconfig.json', 'utf8'),
);

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(
    compilerOptions.paths || {},
    { prefix: '<rootDir>/' },
  ),
};
