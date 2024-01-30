import { noop, isUndefined } from 'lodash';

enum LogLevel {
    SILENT = -1 as number,
    ERROR = 0 as number,
    WARN = 1 as number,
    INFO = 2 as number,
    DEBUG = 3 as number,
    TRACE = 4 as number,
}

const logFunctions: {
    [key: number]: (...args: any[]) => void;
} = {
    [LogLevel.SILENT]: noop,
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

class Logger {
    private logLevel: LogLevel = LogLevel.ERROR;

    public setLogLevel = (newLogLevel: LogLevel): void => {
        this.logLevel = newLogLevel;
    };

    public getLogLevel = (): LogLevel => this.logLevel;

    public canLog(logLevel: LogLevel): boolean {
        if (logLevel === LogLevel.SILENT) return false;
        if (!isUndefined(globalLogLevelOverride)) {
            return globalLogLevelOverride >= logLevel;
        }
        return this.logLevel >= logLevel;
    }

    public async logMessages(args: any[], logLevel: LogLevel): Promise<void> {
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

export { logger, setGlobalLogLevelOverride, LogLevel };
