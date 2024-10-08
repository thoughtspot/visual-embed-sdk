import 'jest-fetch-mock';
import { getPreview } from './preview-service';

describe('getPreview', () => {
    test('should return preview', async () => {
        fetchMock.mockResponses(
            JSON.stringify({
                data: {
                    getEurekaVizSnapshot: {
                        id: 'previewId',
                        vizcontent: '<vizcontent>',
                    },
                },
            }),
        );
        const res = await getPreview('tshost', 'vizId', 'liveboardId');
        expect(res.id).toEqual('previewId');
        expect(res.vizcontent).toEqual('<vizcontent>');
    });
});
