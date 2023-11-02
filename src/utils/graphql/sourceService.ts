import { graphqlQuery } from './graphql-request';

export const getSourceDetailQuery = `
    query GetSourceDetail($ids: [GUID!]!) {
        getSourceDetailById(ids: $ids, type: LOGICAL_TABLE) {
        id
        name
        description
        authorName
        authorDisplayName
        isExternal
        type
        created
        modified
        columns {
            id
            name
            author
            authorDisplayName
            description
            dataType
            type
            modified
            ownerName
            owner
            dataRecency
            sources {
            tableId
            tableName
            columnId
            columnName
            __typename
            }
            synonyms
            cohortAnswerId
            __typename
        }
        relationships
        destinationRelationships
        dataSourceId
        __typename
        }
    }  
`;

const sourceDetailCache = new Map<string, any>();

/**
 *
 * @param thoughtSpotHost
 * @param sourceId
 */
export async function getSourceDetail(
    thoughtSpotHost: string,
    sourceId: string,
): Promise<any> {
    if (sourceDetailCache.get(sourceId)) {
        return sourceDetailCache.get(sourceId);
    }
    const details = await graphqlQuery({
        query: getSourceDetailQuery,
        variables: {
            ids: [sourceId],
        },
        thoughtSpotHost,
    });

    const souceDetails = details[0];
    if (souceDetails) {
        sourceDetailCache.set(sourceId, souceDetails);
    }

    return souceDetails;
}
