import 'jest-fetch-mock';
import * as base from '../../embed/base';
import { createLiveboardWithAnswers } from './liveboardService';

describe('createLiveboardWithAnswers', () => {
    test('should create liveboard with answers', async () => {
        const answers: any = [
            {
                getTML: jest.fn().mockResolvedValue({
                    answer: {
                        search_query: '[revenue]',
                    },
                }),
            },
        ];
        const name = 'liveboard';
        const thoughtSpotHost = 'https://thoughtspot.example.com';
        const liveboardId = 'liveboardId';
        const lbTml = {
            guid: liveboardId,
            liveboard: {
                name,
                visualizations: [
                    {
                        id: 'Viz_0',
                        answer: {
                            search_query: '[revenue]',
                        },
                    },
                ],
                layout: {
                    tiles: [
                        {
                            visualization_id: 'Viz_0',
                            size: 'MEDIUM_SMALL',
                        },
                    ],
                },
            },
        };
        const result = {
            success: true,
        };

        fetchMock.mockResponseOnce(JSON.stringify([{ metadata_id: liveboardId }]));
        jest.spyOn(base, 'executeTML').mockResolvedValue(result);
        const res = await createLiveboardWithAnswers(answers, name);
        expect(res).toEqual(result);
        expect(base.executeTML).toHaveBeenCalledWith({
            metadata_tmls: [JSON.stringify(lbTml)],
            import_policy: 'ALL_OR_NONE',
        });

        fetchMock.mockResponseOnce(JSON.stringify([]));
        jest.spyOn(base, 'executeTML').mockResolvedValue(result);
        await createLiveboardWithAnswers(answers, name);
        delete lbTml.guid;
        expect(base.executeTML).toHaveBeenCalledWith({
            metadata_tmls: [JSON.stringify(lbTml)],
            import_policy: 'ALL_OR_NONE',
        });
    });
});
