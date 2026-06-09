export declare const getPreviewQuery = "\nquery GetEurekaVizSnapshots(\n    $vizId: String!, $liveboardId: String!) {\n    getEurekaVizSnapshot(\n      id: $vizId\n      reportBookId: $liveboardId\n      reportBookType: \"PINBOARD_ANSWER_BOOK\"\n      version: 9999999\n    ) {\n      id\n      vizContent\n      snapshotType\n      createdMs\n    }\n  } \n";
/**
 *
 * @param thoughtSpotHost
 * @param vizId
 * @param liveboardId
 */
export declare function getPreview(thoughtSpotHost: string, vizId: string, liveboardId: string): Promise<any>;
//# sourceMappingURL=preview-service.d.ts.map