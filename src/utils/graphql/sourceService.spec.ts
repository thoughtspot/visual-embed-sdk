import 'jest-fetch-mock';
import { getSourceDetail } from './sourceService';

describe('Source service tests', () => {
    test('Should return source detail and cache it', async () => {
        await getSourceDetail('https://tshost', 'id');
        await getSourceDetail('https://tshost', 'id');
        expect(fetchMock).toBeCalledTimes(1);
    });
});
