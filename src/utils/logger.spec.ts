let logger: any;
let LogLevel: any;
let setGlobalLogLevelOverride: any;

const consoleErrorSpy = jest.spyOn(console, 'error');
const consoleWarnSpy = jest.spyOn(console, 'warn');
const consoleInfoSpy = jest.spyOn(console, 'info');
const consoleDebugSpy = jest.spyOn(console, 'debug');
const consoleTraceSpy = jest.spyOn(console, 'trace');

describe('Logger', () => {
    beforeAll(async () => {
        const a = await import('./logger');
        logger = a.logger;
        LogLevel = a.LogLevel;
        setGlobalLogLevelOverride = a.setGlobalLogLevelOverride;
    });

    beforeEach(() => {
        // Reset the logger's log level before each test
        setGlobalLogLevelOverride(LogLevel.TRACE);
        logger.setLogLevel(LogLevel.ERROR);

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleInfoSpy.mockRestore();
        consoleDebugSpy.mockRestore();
        consoleTraceSpy.mockRestore();
    });

    it('should set the log level correctly', () => {
        logger.setLogLevel(LogLevel.INFO);
        expect(logger.getLogLevel()).toBe(LogLevel.INFO);

        logger.setLogLevel(LogLevel.DEBUG);
        expect(logger.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should log messages based on the log level', () => {
        logger.setLogLevel(LogLevel.ERROR);
        logger.error('Error message');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');

        logger.warn('Warning message');
        expect(consoleTraceSpy).not.toHaveBeenCalled();

        logger.setLogLevel(LogLevel.WARN);
        logger.error('Warning message');
        logger.warn('Warning message');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Warning message');
        expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message');
    });

    it('should log messages with the global log level override', () => {
        setGlobalLogLevelOverride(LogLevel.WARN);

        logger.error('Error message');
        logger.warn('Warn message');
        logger.info('Info message');
        logger.trace('Trace message');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');
        expect(consoleWarnSpy).toHaveBeenCalledWith('Warn message');
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(consoleDebugSpy).not.toHaveBeenCalled();
        expect(consoleTraceSpy).not.toHaveBeenCalled();
    });
});
