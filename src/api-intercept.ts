import { getThoughtSpotHost } from "./config";
import { getEmbedConfig } from "./embed/embedConfig";
import { ERROR_MESSAGE } from "./errors";
import { InterceptedApiType, BaseViewConfig, ApiInterceptFlags, EmbedEvent, EmbedErrorCodes, ErrorDetailsTypes, EmbedErrorDetailsEvent } from "./types";
import { embedEventStatus } from "./utils";
import { logger } from "./utils/logger";

const DefaultInterceptUrlsMap: Record<Exclude<InterceptedApiType, InterceptedApiType.ALL>, string[]> = {
    [InterceptedApiType.AnswerData]: [
        '/prism/?op=GetChartWithData',
        '/prism/?op=GetTableWithHeadlineData',
        '/prism/?op=GetTableWithData',
    ] as string[],
    [InterceptedApiType.LiveboardData]: [
        '/prism/?op=LoadContextBook'
    ] as string[],
};

const formatInterceptUrl = (url: string) => {
    const host = getThoughtSpotHost(getEmbedConfig());
    if (url.startsWith('/')) return `${host}${url}`;
    return url;
}

interface LegacyInterceptFlags {
    isOnBeforeGetVizDataInterceptEnabled: boolean;
}
/**
 * Converts user passed url values to proper urls
 * [ANSER_DATA] => ['https://host/pris/op?=op']
 * @param interceptUrls 
 * @returns 
 */
const processInterceptUrls = (interceptUrls: (string | InterceptedApiType)[]) => {
    let processedUrls = [...interceptUrls];
    Object.entries(DefaultInterceptUrlsMap).forEach(([apiType, apiTypeUrls]) => {
        if (!processedUrls.includes(apiType)) return;
        processedUrls = processedUrls.filter(url => url !== apiType);
        processedUrls = [...processedUrls, ...apiTypeUrls];
    })
    return processedUrls.map(url => formatInterceptUrl(url));
}

/**
 * Returns the data to be sent to embed to setup intercepts
 * the urls to intercept, timeout etc
 * @param viewConfig 
 * @returns 
 */
export const getInterceptInitData = (viewConfig: BaseViewConfig): Required<Omit<ApiInterceptFlags, 'isOnBeforeGetVizDataInterceptEnabled'>> => {
    const combinedUrls = [...(viewConfig.interceptUrls || [])];

    if ((viewConfig as LegacyInterceptFlags).isOnBeforeGetVizDataInterceptEnabled) {
        combinedUrls.push(InterceptedApiType.AnswerData);
    }

    const shouldInterceptAll = combinedUrls.includes(InterceptedApiType.ALL);
    const interceptUrls = shouldInterceptAll ? [InterceptedApiType.ALL] : processInterceptUrls(combinedUrls);

    const interceptTimeout = viewConfig.interceptTimeout;

    return {
        interceptUrls,
        interceptTimeout,
    };
}

const parseJson = (jsonString: string): [any, Error | null] => {
    try {
        const json = JSON.parse(jsonString);
        return [json, null];
    } catch (error) {
        return [null, error];
    }
}

/**
 * Parse the api intercept data and return the parsed data and error if any
 * Embed returns the input and init from the fetch call
 */
const parseInterceptData = (eventDataString: any) => {

    try {
        const [parsedData, error] = parseJson(eventDataString);
        if (error) {
            return [null, error];
        }

        const { input, init } = parsedData;

        const [parsedBody, bodyParseError] = parseJson(init.body);
        if (!bodyParseError) {
            init.body = parsedBody;
        }

        const parsedInit = { input, init };
        return [parsedInit, null];
    } catch (error) {
        return [null, error];
    }
}

const getUrlType = (url: string) => {
    for (const [apiType, apiTypeUrls] of Object.entries(DefaultInterceptUrlsMap)) {
        if (apiTypeUrls.includes(url)) return apiType as InterceptedApiType;
    }
    // TODO: have a unknown type maybe ??
    return InterceptedApiType.ALL;
}

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
export const handleInterceptEvent = async (params: {
    eventData: any,
    executeEvent: (eventType: EmbedEvent, data: any) => void,
    viewConfig: BaseViewConfig,
    getUnsavedAnswerTml: (props: { sessionId?: string, vizId?: string }) => Promise<{ tml: string }>
}) => {

    const { eventData, executeEvent, viewConfig, getUnsavedAnswerTml } = params;

    const [interceptData, bodyParseError] = parseInterceptData(eventData.data);

    if (bodyParseError) {
        const errorDetails: EmbedErrorDetailsEvent = {
            errorType: ErrorDetailsTypes.API,
            message: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
            code: EmbedErrorCodes.PARSING_API_INTERCEPT_BODY_ERROR,
            error: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
        };
        executeEvent(EmbedEvent.Error, errorDetails);
        logger.error('Error parsing request body', bodyParseError);
        return;
    }


    const { input: requestUrl, init } = interceptData;
    
    const sessionId = init?.body?.variables?.session?.sessionId;
    const vizId = init?.body?.variables?.contextBookId;

    const answerDataUrls = DefaultInterceptUrlsMap[InterceptedApiType.AnswerData];
    const legacyInterceptEnabled = viewConfig.isOnBeforeGetVizDataInterceptEnabled;
    const isAnswerDataUrl = answerDataUrls.includes(requestUrl);
    const sendLegacyIntercept = isAnswerDataUrl && legacyInterceptEnabled;
    if (sendLegacyIntercept) {
        const answerTml = await getUnsavedAnswerTml({ sessionId, vizId });
        // Build the legacy payload for backwards compatibility
        const legacyPayload = {
            data: {
                data:  answerTml,
                status: embedEventStatus.END,
                type: EmbedEvent.OnBeforeGetVizDataIntercept
            }
        }
        executeEvent(EmbedEvent.OnBeforeGetVizDataIntercept, legacyPayload);
    }

    const urlType = getUrlType(requestUrl);
    executeEvent(EmbedEvent.ApiIntercept, { ...interceptData, urlType });
}

/**
 * Support both the legacy and new format of the api intercept response
 * @param payload 
 * @returns 
 */
export const processApiInterceptResponse = (payload: any) => {
   const isLegacyFormat = payload?.data?.error;

   if (isLegacyFormat) {
    return processLegacyInterceptResponse(payload);
   }

   return payload;
}

export const processLegacyInterceptResponse = (payload: any) => {

    const errorText = payload?.data?.error?.errorText;
    const errorDescription = payload?.data?.error?.errorDescription;

    const payloadToSend = {
        execute: payload?.data?.execute,
        response: {
            body: {
                errors: [
                    {
                        title: errorText,
                        description: errorDescription,
                        isUserError: true,
                    },
                ],
                data: {},
            },
        },
    };


    return { data: payloadToSend };
}
