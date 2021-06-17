import { processData } from './processData';

describe('Unit test for process data', () => {
    const thoughtSpotHost = 'http://localhost';
    test('ProcessData', () => {
        const data = { type: 'Action' };
        expect(processData(data, thoughtSpotHost)).toBe(data);
    });
});
