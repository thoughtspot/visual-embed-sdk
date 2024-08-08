import { setEmbedConfig } from '../embed/embedConfig';
import { registerReportingObserver, getGlobalReportingObserver, resetGlobalReportingObserver } from './reporting';
import { logger } from './logger';
import { AuthType } from '../types';
import { ERROR_MESSAGE } from '../errors';

jest.mock('./logger');

describe('ReportingObserver', () => {
    let mockReportingObserver: jest.Mock;

    beforeAll(() => {
        // Mock the ReportingObserver
        mockReportingObserver = jest.fn().mockImplementation((callback: any, options: any) => ({
            observe: jest.fn(),
            disconnect: jest.fn(),
            takeRecords: jest.fn(),
        }));
        (window as any).ReportingObserver = mockReportingObserver;
    });

    afterEach(() => {
        jest.clearAllMocks();
        resetGlobalReportingObserver();
    });

    test('should warn if ReportingObserver is not supported', () => {
        (window as any).ReportingObserver = undefined;
        const observer = registerReportingObserver();
        expect(observer).toBeNull();
        expect(logger.warn).toHaveBeenCalledWith('ReportingObserver not supported');
        (window as any).ReportingObserver = mockReportingObserver;
    });

    test('should return existing globalObserver if override is false', () => {
        const firstObserver = registerReportingObserver();
        const secondObserver = registerReportingObserver();
        expect(firstObserver === secondObserver).toBe(true);
    });

    test('should override existing globalObserver if override is true', () => {
        const firstObserver = registerReportingObserver();
        const secondObserver = registerReportingObserver(true);
        expect(firstObserver).not.toBe(secondObserver);
    });

    test('should return globalObserver', () => {
        const observer = registerReportingObserver();
        const globalObserver = getGlobalReportingObserver();
        expect(globalObserver).toBe(observer);
    });

    test('Should register a global observer with callback', () => {
        let callBackPassed: any;

        // Mock the ReportingObserver
        const NewMockRO = jest.fn().mockImplementation((callback: any, options: any) => {
            callBackPassed = callback;
            return ({
                observe: jest.fn(),
                disconnect: jest.fn(),
                takeRecords: jest.fn(),
            });
        });
        const currentObserver = (window as any).ReportingObserver;
        (window as any).ReportingObserver = NewMockRO;

        setEmbedConfig({
            thoughtSpotHost: 'testHost',
            authType: AuthType.None,
        });

        const mockAlert = jest.fn();
        window.alert = mockAlert;

        const observer = registerReportingObserver();
        expect(observer).toBeDefined();
        expect(NewMockRO).toHaveBeenCalled();
        expect(callBackPassed).toBeDefined();

        // call the callback
        callBackPassed([{ type: 'csp-violation', url: 'testHost', body: { effectiveDirective: 'frame-ancestors' } }]);

        expect(mockAlert).toHaveBeenCalledWith(ERROR_MESSAGE.CSP_VIOLATION_ALERT);
        expect(logger.error).toHaveBeenCalledWith(
            ERROR_MESSAGE.CSP_FRAME_HOST_VIOLATION_LOG_MESSAGE,
        );

        (window as any).ReportingObserver = currentObserver;
    });
});
