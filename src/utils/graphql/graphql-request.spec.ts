import 'jest-fetch-mock';
import { getSourceDetail } from './sourceService';
import * as tokenizedFetchUtil from '../../tokenizedFetch';
import { graphqlQuery } from './graphql-request';

const getSourceDetailQuery = `
    query GetSourceDetail($ids: [GUID!]!) {
        getSourceDetailById(ids: $ids, type: LOGICAL_TABLE) {
            id
            name
        }
    }  
`;

const thoughtSpotHost = 'TSHOST';

describe('graphQl tests', () => {
    test('should call tokenizedFetch with correct parameters when graphqlQuery is called', async () => {
        jest.spyOn(tokenizedFetchUtil, 'tokenizedFetch').mockResolvedValue({
            json: jest.fn().mockResolvedValue({
                data: {},
            }),
        } as any);

        const details = await graphqlQuery({
            query: getSourceDetailQuery,
            variables: {
                ids: [2],
            },
            thoughtSpotHost,
        });

        expect(tokenizedFetchUtil.tokenizedFetch).toHaveBeenCalledWith('TSHOST/prism/?op=GetSourceDetail', {
            body: '{"operationName":"GetSourceDetail","query":"\\n    query GetSourceDetail($ids: [GUID!]!) {\\n        getSourceDetailById(ids: $ids, type: LOGICAL_TABLE) {\\n            id\\n            name\\n        }\\n    }  \\n","variables":{"ids":[2]}}',
            credentials: 'include',
            headers: {
                accept: '*/*', 'accept-language': 'en-us', 'content-type': 'application/json;charset=UTF-8', 'x-requested-by': 'ThoughtSpot',
            },
            method: 'POST',
        });

        const details2 = await graphqlQuery({
            query: getSourceDetailQuery,
            variables: {
                ids: [2],
            },
            thoughtSpotHost,
            isCompositeQuery: true,
        });
    });
});
