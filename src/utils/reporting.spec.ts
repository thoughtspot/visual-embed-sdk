import { getEmbedConfig } from '../embed/embedConfig';
import { registerReportingObserver, getGlobalReportingObserver, resetGlobalReportingObserver } from './reporting';
import { logger } from './logger';

jest.mock('../embed/embedConfig');
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
});
