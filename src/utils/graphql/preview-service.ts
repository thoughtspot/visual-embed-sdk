/* eslint-disable quotes */
import { graphqlQuery } from "./graphql-request";

export const getPreviewQuery = `
query GetEurekaVizSnapshots(
    $vizId: String!, $liveboardId: String!) {
    getEurekaVizSnapshot(
      id: $vizId
      reportBookId: $liveboardId
      reportBookType: "PINBOARD_ANSWER_BOOK"
      version: 9999999
    ) {
      id
      vizContent
      snapshotType
      createdMs
    }
  } 
`;

/**
 *
 * @param thoughtSpotHost
 * @param vizId
 * @param liveboardId
 */
export async function getPreview(
    thoughtSpotHost: string,
    vizId: string,
    liveboardId: string,
): Promise<any> {
    return graphqlQuery({
        query: getPreviewQuery,
        variables: { vizId, liveboardId },
        thoughtSpotHost,
    });
}
