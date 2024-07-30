import { getEmbedConfig } from '../embed/embedConfig';
import { logger } from './logger';
import { ERROR_MESSAGE } from '../errors';

enum ReportingObserverType {
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
            const reportBody = body as any;

            const isThoughtSpotHost = url
                && url.startsWith(embedConfig.thoughtSpotHost);

            const isFrameHostError = type === ReportingObserverType.CSP_VIOLATION
                && reportBody.effectiveDirective === 'frame-ancestors';

            if (isThoughtSpotHost && isFrameHostError) {
                if (!embedConfig.suppressErrorAlerts) {
                    alert(ERROR_MESSAGE.CSP_VIOLATION_ALERT);
                }
                logger.error(ERROR_MESSAGE.CSP_FRAME_HOST_VIOLATION_LOG_MESSAGE);
            }
        });
    }, { buffered: true });
    observer.observe();
    return observer;
}

/**
 * Get the global ReportingObserver
 * @returns - ReportingObserver | null
 */
export function getGlobalReportingObserver(): ReportingObserver | null {
    return globalObserver;
}
