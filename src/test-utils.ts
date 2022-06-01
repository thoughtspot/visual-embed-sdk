/**
 * MessageChannel is available in Node > 15.0.0. Since the current node environment's
 * used for github actions is not above 14, we are mocking this for the current unit tests.
 */
export const messageChannelMock: any = {
    port1: {},
    port2: {},
};
export const mockMessageChannel = () => {
    messageChannelMock.port1.close = jest.fn();
    messageChannelMock.port2.onmessage = jest.fn();
    window.MessageChannel = function MessageChannelMock() {
        return messageChannelMock;
    } as any;
};
