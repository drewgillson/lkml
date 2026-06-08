/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/*.ts'],
  // Tests import sources as "../src/foo.js"; strip the .js so ts-jest resolves the .ts.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
