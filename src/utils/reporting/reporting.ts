import { getEmbedConfig } from 'src/embed/embedConfig';
import { logger } from '../logger';
import { ERROR_MESSAGE } from '../../errors';

let globalObserver: ReportingObserver | null = null;

/**
 * Register a global ReportingObserver to capture all unhandled errors
 *
 * @returns - ReportingObserver | null
 * @param overrideExisting
 */
export function registerReportingObserver(overrideExisting = false): ReportingObserver | null {
    if (!('ReportingObserver' in window)) {
        logger.warn('ReportingObserver not supported');
        return null;
    }

    if (overrideExisting && globalObserver) {
        globalObserver.disconnect();
        globalObserver = null;
    }

    if (globalObserver) {
        return globalObserver;
    }

    const embedConfig = getEmbedConfig();

    const observer = new ReportingObserver((reports) => {
        reports.forEach((report) => {
            const { type, url, body } = report;
            const {
                message, source, lineno, colno, stack,
            } = body as any;

            if (embedConfig.thoughtSpotHost === source) {
                if (!embedConfig.suppressErrorAlerts) {
                    alert(ERROR_MESSAGE.CSP_VIOLATION_ALERT);
                }
                logger.error(ERROR_MESSAGE.CSP_VIOLATION_ALERT);
            }

            logger.error(`${type} ${url} ${message} ${source} ${lineno} ${colno} ${stack}`);
        }, { buffered: true });
    });
    observer.observe();
    return observer;
}

/**
 * Get the global ReportingObserver
 *
 * @returns - ReportingObserver | null
 */
export function getGlobalReportingObserver(): ReportingObserver | null {
    return globalObserver;
}
