import { getEmbedConfig } from '../embed/embedConfig';
import { logger } from './logger';
import { ERROR_MESSAGE } from '../errors';

enum ReportType {
  CSP_VIOLATION = 'csp-violation',
  DEPRECATION = 'deprecation',
  INTERVENTION = 'intervention',
}

let globalObserver: ReportingObserver | null = null;

/**
 * Register a global ReportingObserver to capture all unhandled errors
 * @param overrideExisting boolean to override existing observer
 * @returns ReportingObserver | null
 */
export function registerReportingObserver(overrideExisting = false): ReportingObserver | null {
    if (!((window as any).ReportingObserver)) {
        logger.warn(ERROR_MESSAGE.MISSING_REPORTING_OBSERVER);
        return null;
    }

    if (overrideExisting) {
        resetGlobalReportingObserver();
    }

    if (globalObserver) {
        return globalObserver;
    }

    const embedConfig = getEmbedConfig();

    globalObserver = new ReportingObserver((reports) => {
        reports.forEach((report) => {
            const { type, url, body } = report;
            const reportBody = body as any;

            const isThoughtSpotHost = url
                && url.startsWith(embedConfig.thoughtSpotHost);

            const isFrameHostError = type === ReportType.CSP_VIOLATION
                && reportBody.effectiveDirective === 'frame-ancestors';

            if (isThoughtSpotHost && isFrameHostError) {
                if (!embedConfig.suppressErrorAlerts) {
                    alert(ERROR_MESSAGE.CSP_VIOLATION_ALERT);
                }
                logger.error(ERROR_MESSAGE.CSP_FRAME_HOST_VIOLATION_LOG_MESSAGE);
            }
        });
    }, { buffered: true });
    globalObserver.observe();
    return globalObserver;
}

/**
 * Get the global ReportingObserver
 * @returns - ReportingObserver | null
 */
export function getGlobalReportingObserver(): ReportingObserver | null {
    return globalObserver;
}

/**
 * Resets the global ReportingObserver
 */
export function resetGlobalReportingObserver(): void {
    if (globalObserver) globalObserver.disconnect();
    globalObserver = null;
}
