const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

if (typeof btoa === 'undefined') {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

if (typeof atob === 'undefined') {
    global.atob = (b64Encoded) => Buffer.from(b64Encoded, 'base64').toString('binary');
}

const error = global.console.error;

global.console.error = (...args) => {
    error(...args); // keep default behaviour
    throw new Error(...args);
};

global.MessageChannel = jest.fn().mockImplementation(() => {
    let onmessage;
    return {
        port1: {
            set onmessage(cb) {
                onmessage = cb;
            },
        },
        port2: {
            postMessage: (data) => {
                onmessage?.({ data });
            },
        },
    };
});
