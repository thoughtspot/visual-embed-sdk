module.exports = {
    server: {
        command: 'gatsby clean && gatsby build && gatsby serve -p 9545',
        debug: true,
        port: 9545,
        launchTimeout: 60000,
        usedPortAction: 'kill',
    },
};
