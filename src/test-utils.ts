
/**
 * MessageChannel is available in Node > 15.0.0. Since the current node environment's
 * used for github actions is not above 14, we are mocking this for the current unit tests.
 */
export let messageChannelMock: any;
export const mockMessageChannel = () => {
    messageChannelMock = {
        port1: {
            close: jest.fn(),
            onmessage: (data: any) => {},
        },
        port2: {},
    };
    window.MessageChannel = function MessageChannelMock() {
        return messageChannelMock;
    } as any;
}