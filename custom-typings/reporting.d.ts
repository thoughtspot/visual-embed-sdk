interface ReportingObserver {
  observe: () => void;
  disconnect: () => void;
  takeRecords: () => any[];
}

declare const ReportingObserver: {
  prototype: ReportingObserver;
  new (callback: (reports: any[]) => void, options?: { buffered?: boolean }): ReportingObserver;
};
