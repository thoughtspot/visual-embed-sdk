import { tokenizedFetch } from '../../tokenizedFetch';
import { AnswerService } from '../graphql/answerService/answerService';
import { getEmbedConfig } from '../../embed/embedConfig';
import { executeTML } from '../../embed/base';

/**
 * Creates a new Liveboard in ThoughtSpot using the provided AnswerService instances.
 * 
 * Each answer will be added as a visualization to the newly created Liveboard.
 * 
 * @param {AnswerService[]} answers - An array of initialized `AnswerService` instances
 * representing the answers to be added to the Liveboard.
 * @param {string} name - The name of the Liveboard to create.
 * @returns result Promise
 * @version SDK: 1.33.1 | ThoughtSpot: *
 * @example
 * ```js
 * import { EmbedEvent, AnswerService } from "@thoughtspot/visual-embed-sdk";
 *
 * embed.on(EmbedEvent.Data, async () => {
 *   try {
 *     const answerService = await embed.getAnswerService();
 *     const lb = await createLiveboardWithAnswers(
 *       [answerService],
 *       "My Liveboard"
 *     );
 *     console.log("Liveboard created:", lb);
 *   } catch (err) {
 *     console.error("Failed to create liveboard:", err);
 *   }
 * });
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
