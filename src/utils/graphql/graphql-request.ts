import { tokenizedFetch } from '../../tokenizedFetch';
import { getOperationNameFromQuery } from '../../utils';

/**
 *
 * @param root0
 * @param root0.query
 * @param root0.variables
 * @param root0.thoughtSpotHost
 * @param root0.isCompositeQuery
 */
export async function graphqlQuery({
    query,
    variables,
    thoughtSpotHost,
    isCompositeQuery = false,
}: {
    query: string,
    variables: any,
    thoughtSpotHost: string,
    isCompositeQuery?: boolean
}): Promise<any> {
    const operationName = getOperationNameFromQuery(query);
    try {
        const response = await tokenizedFetch(`${thoughtSpotHost}/prism/?op=${operationName}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json;charset=UTF-8',
                'x-requested-by': 'ThoughtSpot',
                accept: '*/*',
                'accept-language': 'en-us',
            },
            body: JSON.stringify({
                operationName,
                query,
                variables,
            }),
            credentials: 'include',
        });
        const result = await response.json();
        const dataValues = Object.values(result.data);
        return (isCompositeQuery) ? result.data : dataValues[0];
    } catch (error) {
        return error;
    }
}
