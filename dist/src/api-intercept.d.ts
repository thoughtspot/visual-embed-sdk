import { BaseViewConfig, ApiInterceptFlags, EmbedEvent } from "./types";
/**
 * Returns the data to be sent to embed to setup intercepts
 * the urls to intercept, timeout etc
 * @param viewConfig
 * @returns
 */
export declare const getInterceptInitData: (viewConfig: BaseViewConfig) => Required<Omit<ApiInterceptFlags, 'isOnBeforeGetVizDataInterceptEnabled'>>;
/**
 * Handle Api intercept event and simulate legacy onBeforeGetVizDataIntercept event
 *
 * embed sends -> ApiIntercept -> we send
 *  ApiIntercept
 *  OnBeforeGetVizDataIntercept (if url is part of DefaultUrlMap.AnswerData)
 *
 * @param params
 * @returns
 */
export declare const handleInterceptEvent: (params: {
    eventData: any;
    executeEvent: (eventType: EmbedEvent, data: any) => void;
    viewConfig: BaseViewConfig;
    getUnsavedAnswerTml: (props: {
        sessionId?: string;
        vizId?: string;
    }) => Promise<{
        tml: string;
    }>;
}) => Promise<void>;
/**
 * Support both the legacy and new format of the api intercept response
 * @param payload
 * @returns
 */
export declare const processApiInterceptResponse: (payload: any) => any;
export declare const processLegacyInterceptResponse: (payload: any) => {
    data: {
        execute: any;
        response: {
            body: {
                errors: {
                    title: any;
                    description: any;
                    isUserError: boolean;
                }[];
                data: {};
            };
        };
    };
};
//# sourceMappingURL=api-intercept.d.ts.map