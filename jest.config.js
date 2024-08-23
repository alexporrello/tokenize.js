// @ts-check

import { register } from 'ts-node';

register({
    compilerOptions: {
        module: 'nodenext'
    }
});

/** @type {import('jest').Config} */
export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    modulePaths: [
        '<rootDir>/app/',
        '<rootDir>/node_modules',
        '<rootDir>/database'
    ],
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    transformIgnorePatterns: ['node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '(.+)\\.js': '$1'
    },
    globals: {
        'ts-jest': {
            useESM: true
        }
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    testEnvironment: 'node'
};
