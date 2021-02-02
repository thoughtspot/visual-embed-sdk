/**
 * scripts to use in package.json
 */
'use strict';

// get node process
const { exec } = require('child_process');

// get all supplied arguments
let args = process.argv;

// remove node and file path arguments
args.splice(0, 2);

// used to handle command options supplied as arguments
const cmdOptionHandler = (command, options) => {
    switch (command) {
        case 'build': {
            if (options[1]) {
                if (options[1] !== 'noprefix') {
                    console.log(
                        `Invalid command option passed to '${command}': `,
                        options[1],
                    );
                } else {
                    return 'noprefix';
                }
            } else {
                // default option of noprefix for build command
                return 'prefix';
            }

            return false;
        }
        case 'build-and-publish':
        case 'publish': {
            const cmdOptions = options[1] && options[1].split('=');
            if (cmdOptions) {
                if (cmdOptions[0] !== 'branch') {
                    console.log(
                        `Invalid command option passed to '${command}': `,
                        cmdOptions[0],
                    );
                } else if (!cmdOptions[1]) {
                    console.log(
                        `Invalid value (ex.: option=value) passed to '${cmdOptions[0]}' option: `,
                        cmdOptions[1],
                    );
                } else {
                    const branchName = cmdOptions[1];
                    return branchName;
                }
            } else {
                // default branch name for publish command
                return '7.3.0-docs';
            }

            return false;
        }
        default:
            console.log(
                `'${cmdName}' command does not support runtime options.`,
            );
            return;
    }
};

// callback handler for process.exec function
const cb = (error, stdout, stderr) => {
    if (error) {
        console.log(`gatsby '${cmdName}' command error(s): `, error);
        return;
    }

    // it worked
    console.log(
        `gatsby '${cmdName}' command successfully executed with message: `,
        stdout,
    );
};

// get command name to run
const cmdName = args[0];

// command string to execute
let cmdToExecute = '';

// validate and prepare supported command
switch (cmdName) {
    case 'develop':
        cmdToExecute = `gatsby develop`;
        break;
    case 'build':
        const prefixOption = cmdOptionHandler(cmdName, args);
        if (!prefixOption) return;

        cmdToExecute = `gatsby build ${
            prefixOption === 'prefix' ? '--prefix-paths' : ''
        }`;
        break;
    case 'build-and-publish': {
        const branchName = cmdOptionHandler(cmdName, args);
        if (!branchName) return;

        cmdToExecute = `gatsby build --prefix-paths && gh-pages -d public -b ${branchName}`;
        break;
    }
    case 'publish': {
        const branchName = cmdOptionHandler(cmdName, args);
        if (!branchName) return;

        cmdToExecute = `gh-pages -d public -b ${branchName}`;
        break;
    }
    case 'serve':
        cmdToExecute = `gatsby serve`;
        break;
    case 'clean':
        cmdToExecute = `gatsby clean`;
        break;
    default:
        console.log(`'${cmdName}' command is not supported.`);
        return;
}

// execute prepared command
exec(cmdToExecute, cb);
