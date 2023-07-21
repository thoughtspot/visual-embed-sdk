/**
 * scripts to use in package.json
 */
'use strict';
const commandLineArgs = require('command-line-args');

// parse the main command
const mainCmdDefinitions = [
    { name: 'command', type: String, defaultOption: true },
];
const mainOptions = commandLineArgs(mainCmdDefinitions, {
    stopAtFirstUnknown: true,
});
const argv = mainOptions._unknown || [];

// get node process
const { exec } = require('child_process');

// get all the options for a command
const getCmdOptions = (definition, argv) => {
    try {
        return commandLineArgs(definition, { argv });
    } catch (err) {
        console.log(`Command run error - ${err.name} :: '${err.optionName}'`);
        return;
    }
};

// used to validate command options supplied as arguments
const validateCmdOptions = (definitions, options) => {
    let isValid = true;
    if (definitions.length === 0) {
        console.log('Command run error - OPTIONS_NOT_SUPPORTED');
        return false;
    }

    definitions.some((def) => {
        if (def.required && !options.hasOwnProperty(def.name)) {
            console.log(
                `Command run error - MISSING_REQUIRED_OPTION :: '${def.name}'`,
            );
            isValid = false;
            return true;
        } else if (
            (typeof def.type() === 'number' && isNaN(options[def.name])) ||
            typeof def.type() !== typeof options[def.name]
        ) {
            console.log(
                `Command run error - OPTION_INVALID_TYPE :: '{ ${def.name}: ${
                    options[def.name]
                } }'`,
            );
            isValid = false;
            return true;
        }
        return false;
    });

    return isValid;
};

// callback handler for process.exec function
const cb = (error, stdout, stderr) => {
    if (error) {
        console.log(
            `gatsby '${mainOptions.command}' command error(s): `,
            error,
        );
        return;
    }

    // it worked
    console.log(
        `gatsby '${mainOptions.command}' command successfully executed with message: `,
        stdout,
    );
};

// command string to execute
let cmdToExecute = '';

// validate and prepare supported command
switch (mainOptions.command) {
    case 'develop': {
        const developDefinitions = [
            {
                name: 'port',
                alias: 'p',
                type: Number,
                defaultValue: 8002,
                required: true,
            },
        ];

        const developOptions = getCmdOptions(developDefinitions, argv);
        if (!developOptions) return;

        const isValid = validateCmdOptions(developDefinitions, developOptions);
        if (!isValid) return;

        cmdToExecute = `gatsby develop -p ${developOptions.port}`;
        break;
    }
    case 'build': {
        const buildDefinitions = [
            {
                name: 'noprefix',
                type: Boolean,
                defaultValue: false,
                required: true,
            },
        ];

        const buildOptions = getCmdOptions(buildDefinitions, argv);
        if (!buildOptions) return;

        const isValid = validateCmdOptions(buildDefinitions, buildOptions);
        if (!isValid) return;

        cmdToExecute = `gatsby clean && gatsby build ${
            buildOptions.noprefix ? '' : '--prefix-paths'
        }`;
        break;
    }
    case 'build-and-publish': {
        const bapDefinitions = [
            {
                name: 'branch',
                alias: 'b',
                type: String,
                defaultValue: 'gh-pages',
                required: true,
            },
        ];

        const bapOptions = getCmdOptions(bapDefinitions, argv);
        if (!bapOptions) return;

        const isValid = validateCmdOptions(bapDefinitions, bapOptions);
        if (!isValid) return;

        cmdToExecute = `gatsby clean && gatsby build --prefix-paths && gh-pages -d public -b ${bapOptions.branch}`;
        break;
    }
    case 'publish': {
        const publishDefinitions = [
            {
                name: 'branch',
                alias: 'b',
                type: String,
                defaultValue: 'gh-pages',
                required: true,
            },
        ];

        const publishOptions = getCmdOptions(publishDefinitions, argv);
        if (!publishOptions) return;

        const isValid = validateCmdOptions(publishDefinitions, publishOptions);
        if (!isValid) return;

        cmdToExecute = `gh-pages -d public -b ${publishOptions.branch}`;
        break;
    }
    case 'serve':
        cmdToExecute = `gatsby serve`;
        break;
    case 'clean':
        cmdToExecute = `gatsby clean`;
        break;
    default:
        console.log(`'${mainOptions.command}' command is not supported.`);
        return;
}

// execute prepared command
const proc = exec(cmdToExecute, cb);

// print the logs
proc.stdout.on('data', console.log);