#!/usr/bin/env node

// @ts-check

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { argv } from 'process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * @typedef { { compilerOptions: { outDir: string; } } } tsConfig
 */

yargs(hideBin(argv))
    .command(
        'exec <path>',
        'The path relative to the current directory of the spec file',
        (yargs) => {
            return yargs
                .positional('path', {
                    type: 'string',
                    coerce: (filename) => {
                        console.log(filename);
                        if (!filename)
                            throw 'You must provide a spec file relative to the out directory.';
                        return filename;
                    }
                })
                .option('project', {
                    alias: 'p',
                    describe:
                        'Provide a path to a typescript tsconfig.json file.',
                    string: true,
                    default: 'tsconfig.spec.json',
                    coerce: (project) => readTsConfig(project)
                })
                .option('watch', {
                    describe: 'Watch for file changes'
                })
                .version()
                .help();
        },
        ({ path, project, watch }) => {
            const { project: tsPath, tsConfig } = project;

            const outDir = tsConfig.compilerOptions.outDir;

            const tscArgs = ['-p', tsPath];
            if (watch) tscArgs.push('--watch');

            /** @type { import('child_process').ChildProcess } */
            let nodeWatch;

            const tsc = spawn('tsc', tscArgs);
            tsc.stdout.setEncoding('utf8');
            tsc.stdout.on('data', () => {
                nodeWatch?.kill();
                console.clear();
                nodeWatch = launchNode(resolve(outDir, path));
            });

            tsc.stderr.setEncoding('utf8');
            tsc.stderr.on('data', (data) => {
                console.error(data);
            });
        }
    )
    .parse();

/**
 * @param {string} project
 * @returns The absolute path to `project` and the read-in tsconfig.json.
 */
function readTsConfig(project) {
    project = resolve(project);

    if (!existsSync(project)) {
        throw 'tsconfig does not exist at ' + project + '.';
    }

    /** @type {tsConfig} */
    const tsConfig = JSON.parse(readFileSync(project, 'utf-8'));

    return { project, tsConfig };
}

/**
 * @param {string[]} args The node arguments
 * @returns The arguments for launching node.
 */
function launchNode(...args) {
    return spawn('node', args, {
        cwd: process.cwd(),
        stdio: 'inherit'
    });
}
