/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    setupFiles: ['<rootDir>/tests/setup.js']
};

module.exports = config; 