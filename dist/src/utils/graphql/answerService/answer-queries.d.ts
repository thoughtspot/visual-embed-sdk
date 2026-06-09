export declare const getUnaggregatedAnswerSession: string;
export declare const removeColumns: string;
export declare const addColumns: string;
export declare const addFilter: string;
export declare const getAnswer: string;
export declare const getAnswerData: string;
export declare const addVizToLiveboard: string;
export declare const getSQLQuery = "\n    mutation GetSQLQuery($session: BachSessionIdInput!) {\n        Answer__getQuery(session: $session) {\n            sql\n        }\n    }\n";
export declare const updateDisplayMode = "\n   mutation UpdateDisplayMode(\n    $session: BachSessionIdInput!\n    $displayMode: DisplayMode\n) {\n    Answer__updateProperties(session: $session, displayMode: $displayMode) {\n        id {\n            sessionId\n            genNo\n            acSession {\n                sessionId\n                genNo\n            }\n        }\n        answer {\n            id\n            displayMode\n            suggestedDisplayMode\n        }\n    }\n}\n";
export declare const getAnswerTML = "\nmutation GetUnsavedAnswerTML($session: BachSessionIdInput!, $exportDependencies: Boolean, $formatType:  EDocFormatType, $exportPermissions: Boolean, $exportFqn: Boolean) {\n  UnsavedAnswer_getTML(\n    session: $session\n    exportDependencies: $exportDependencies\n    formatType: $formatType\n    exportPermissions: $exportPermissions\n    exportFqn: $exportFqn\n  ) {\n    zipFile\n    object {\n      edoc\n      name\n      type\n      __typename\n    }\n    __typename\n  }\n}";
//# sourceMappingURL=answer-queries.d.ts.map