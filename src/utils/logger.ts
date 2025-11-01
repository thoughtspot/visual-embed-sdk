import { LogLevel } from '../types';

const logFunctions: {
    [key: string]: (...args: any[]) => void;
} = {
    [LogLevel.SILENT]: () => undefined,
    [LogLevel.ERROR]: console.error,
    [LogLevel.WARN]: console.warn,
    [LogLevel.INFO]: console.info,
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.TRACE]: console.trace,
};

let globalLogLevelOverride: LogLevel = LogLevel.TRACE;
const setGlobalLogLevelOverride = (logLevel: LogLevel): void => {
    globalLogLevelOverride = logLevel;
};

const logLevelToNumber: { [key: string]: number } = {
    [LogLevel.SILENT]: 0,
    [LogLevel.ERROR]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 3,
    [LogLevel.DEBUG]: 4,
    [LogLevel.TRACE]: 5,
};
const compareLogLevels = (logLevel1: LogLevel, logLevel2: LogLevel): number => {
    const logLevel1Index = logLevelToNumber[logLevel1];
    const logLevel2Index = logLevelToNumber[logLevel2];
    return logLevel1Index - logLevel2Index;
};

class Logger {
    private logLevel: LogLevel = LogLevel.ERROR;

    public setLogLevel = (newLogLevel: LogLevel): void => {
        this.logLevel = newLogLevel;
    };

    public getLogLevel = (): LogLevel => this.logLevel;

    public canLog(logLevel: LogLevel): boolean {
        if (logLevel === LogLevel.SILENT) return false;
        if (globalLogLevelOverride !== undefined) {
            return compareLogLevels(globalLogLevelOverride, logLevel) >= 0;
        }
        return compareLogLevels(this.logLevel, logLevel) >= 0;
    }

    public logMessages(args: any[], logLevel: LogLevel): void {
        if (this.canLog(logLevel)) {
            const logFn = logFunctions[logLevel];
            if (logFn) {
                logFn(...args);
            }
        }
    }

    public log(...args: any[]): void {
        this.info(args);
    }

    public info(...args: any[]): void {
        this.logMessages(args, LogLevel.INFO);
    }

    public debug(...args: any[]): void {
        this.logMessages(args, LogLevel.DEBUG);
    }

    public trace(...args: any[]): void {
        this.logMessages(args, LogLevel.TRACE);
    }

    public error(...args: any[]): void {
        this.logMessages(args, LogLevel.ERROR);
    }

    public warn(...args: any[]): void {
        this.logMessages(args, LogLevel.WARN);
    }
}

const logger = new Logger();

export { LogLevel, logger, setGlobalLogLevelOverride };
