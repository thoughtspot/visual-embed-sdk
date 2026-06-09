/**
 * Register a global ReportingObserver to capture all unhandled errors
 * @param overrideExisting boolean to override existing observer
 * @returns ReportingObserver | null
 */
export declare function registerReportingObserver(overrideExisting?: boolean): ReportingObserver | null;
/**
 * Get the global ReportingObserver
 * @returns - ReportingObserver | null
 */
export declare function getGlobalReportingObserver(): ReportingObserver | null;
/**
 * Resets the global ReportingObserver
 */
export declare function resetGlobalReportingObserver(): void;
//# sourceMappingURL=reporting.d.ts.map