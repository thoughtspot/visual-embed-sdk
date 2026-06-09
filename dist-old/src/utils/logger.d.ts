import { LogLevel } from '../types';
declare const setGlobalLogLevelOverride: (logLevel: LogLevel) => void;
declare class Logger {
    private logLevel;
    setLogLevel: (newLogLevel: LogLevel) => void;
    getLogLevel: () => LogLevel;
    canLog(logLevel: LogLevel): boolean;
    logMessages(args: any[], logLevel: LogLevel): void;
    log(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
    trace(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
}
declare const logger: Logger;
export { LogLevel, logger, setGlobalLogLevelOverride };
//# sourceMappingURL=logger.d.ts.map