import { tokenizedFetch } from '../../tokenizedFetch';
import { AnswerService } from '../graphql/answerService/answerService';
import { getEmbedConfig } from '../../embed/embedConfig';
import { executeTML } from '../../embed/base';

/**
 * Create a liveboard with the given answers
 * @param answers AnswerService[]
 * @param name string
 * @returns result Promise
 * @version SDK: 1.33.1 | ThoughtSpot: *
 * @example
 * ```js
 *   const lb = createLiveboardWithAnswers([
 *      new AnswerService(session, null, 'tshost'),
 *   ], "my-liveboard");
 * ```
 */
export const createLiveboardWithAnswers = async (
    answers: AnswerService[],
    name: string,
): Promise<any> => {
    const { thoughtSpotHost, authType } = getEmbedConfig();
    const resp = await tokenizedFetch(
        `${thoughtSpotHost}/api/rest/2.0/metadata/search`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                metadata: [{
                    type: 'LIVEBOARD',
                    identifier: name,
                }],
            }),
        },
    );
    const lbList = await resp.json();
    const liveboardId = lbList[0]?.metadata_id;

    const answerTMLs = (await Promise.all(answers.map((a) => a.getTML())))
        .filter((tml: any) => tml.answer.search_query);

    const lbTml: any = {
        guid: liveboardId,
        liveboard: {
            name,
            visualizations: answerTMLs.map((tml: any, idx) => ({
                id: `Viz_${idx}`,
                answer: tml.answer,
            })),
            layout: {
                tiles: answerTMLs.map((tml: any, idx) => ({
                    visualization_id: `Viz_${idx}`,
                    size: 'MEDIUM_SMALL',
                })),
            },
        },
    };

    const result = await executeTML({
        metadata_tmls: [JSON.stringify(lbTml)],
        import_policy: 'ALL_OR_NONE',
    });

    return result;
};
