export declare const getSourceDetailQuery = "\n    query GetSourceDetail($ids: [GUID!]!) {\n        getSourceDetailById(ids: $ids, type: LOGICAL_TABLE) {\n        id\n        name\n        description\n        authorName\n        authorDisplayName\n        isExternal\n        type\n        created\n        modified\n        columns {\n            id\n            name\n            author\n            authorDisplayName\n            description\n            dataType\n            type\n            modified\n            ownerName\n            owner\n            dataRecency\n            sources {\n            tableId\n            tableName\n            columnId\n            columnName\n            __typename\n            }\n            synonyms\n            cohortAnswerId\n            __typename\n        }\n        relationships\n        destinationRelationships\n        dataSourceId\n        __typename\n        }\n    }  \n";
/**
 *
 * @param thoughtSpotHost
 * @param sourceId
 */
export declare function getSourceDetail(thoughtSpotHost: string, sourceId: string): Promise<any>;
//# sourceMappingURL=sourceService.d.ts.map