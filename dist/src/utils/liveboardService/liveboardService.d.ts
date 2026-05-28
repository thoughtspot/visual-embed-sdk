import { AnswerService } from '../graphql/answerService/answerService';
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
export declare const createLiveboardWithAnswers: (answers: AnswerService[], name: string) => Promise<any>;
//# sourceMappingURL=liveboardService.d.ts.map