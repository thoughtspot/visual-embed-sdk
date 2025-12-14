import 'jest-fetch-mock';
import { getSourceDetail } from './sourceService';

describe('Source service tests', () => {
    test('Should return source detail and cache it', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({
            data: {
                getSourceDetail: [{
                    Bla: {
                        id: {},
                    },
                }],
            },
        }));
        await getSourceDetail('https://tshost', 'id');
        await getSourceDetail('https://tshost', 'id');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
