import { getThoughtSpotHost } from "./config";
import { getEmbedConfig } from "./embed/embedConfig";
import { InterceptedApiType, BaseViewConfig, EmbedConfig, InterceptV2Flags, EmbedEvent } from "./types";
import { logger } from "./utils/logger";


const defaultUrls: Record<Exclude<InterceptedApiType, InterceptedApiType.ALL>, string[]> = {
    [InterceptedApiType.METADATA]: [
        '/prism/?op=CreateAnswerSession',
        '/prism/?op=GetV2SourceDetail',
    ] as string[],
    [InterceptedApiType.ANSWER_DATA]: [
        '/prism/?op=GetChartWithData',
        '/prism/?op=GetTableWithHeadlineData',
    ] as string[],
    [InterceptedApiType.LIVEBOARD_DATA]: [
        '/prism/?op=LoadContextBook'
    ] as string[],
};

const formatInterceptUrl = (url: string) => {
    const host = getThoughtSpotHost(getEmbedConfig());
    if (url.startsWith('/')) return `${host}${url}`;
    return url;
}

export const processApiIntercept = async (eventData: any) => {

    return JSON.parse(eventData.data);
}

interface LegacyInterceptFlags {
    isOnBeforeGetVizDataInterceptEnabled: boolean;
}

const processInterceptUrls = (interceptUrls: (string | InterceptedApiType)[]) => {
    let processedUrls = [...interceptUrls];
    Object.entries(defaultUrls).forEach(([apiType, apiTypeUrls]) => {
        if (!processedUrls.includes(apiType)) return;
        processedUrls = processedUrls.filter(url => url !== apiType);
        processedUrls = [...processedUrls, ...apiTypeUrls];
    })
    return processedUrls.map(url => formatInterceptUrl(url));
}
export const getInterceptInitData = (embedConfig: EmbedConfig, viewConfig: BaseViewConfig): InterceptV2Flags => {

    const enableApiIntercept = (embedConfig.enableApiIntercept || viewConfig.enableApiIntercept) && (viewConfig.enableApiIntercept !== false);

    if (!enableApiIntercept) return {
        enableApiIntercept: false,
    };

    const combinedUrls = [...(embedConfig.interceptUrls || []), ...(viewConfig.interceptUrls || [])];

    if ((viewConfig as LegacyInterceptFlags).isOnBeforeGetVizDataInterceptEnabled) {
        combinedUrls.push(InterceptedApiType.ANSWER_DATA);
    }

    const shouldInterceptAll = combinedUrls.includes(InterceptedApiType.ALL);
    const interceptUrls = shouldInterceptAll ? [InterceptedApiType.ALL] : processInterceptUrls(combinedUrls);

    const interceptTimeout = embedConfig.interceptTimeout || viewConfig.interceptTimeout;

    return {
        interceptUrls,
        interceptTimeout,
        enableApiIntercept,
    };
}

/**
 * 
 * @param fetchInit 
 */
const parseInterceptData = (eventDataString: any) => {

    try {
        const { input, init } = JSON.parse(eventDataString);

        init.body = JSON.parse(init.body);

        const parsedInit = { input, init };
        return [parsedInit, null];
    } catch (error) {
        return [null, error];
    }
}

export const handleInterceptEvent = async (params: { eventData: any, executeEvent: (eventType: EmbedEvent, data: any) => void, embedConfig: EmbedConfig, viewConfig: BaseViewConfig, getUnsavedAnswerTml: (props: { sessionId?: string, vizId?: string }) => Promise<{ tml: string }> }) => {

    const { eventData, executeEvent, viewConfig, getUnsavedAnswerTml } = params;

    const [interceptData, bodyParseError] = parseInterceptData(eventData.data);

    if (bodyParseError) {
        executeEvent(EmbedEvent.Error, {
            error: 'Error parsing api intercept body',
        });
        logger.error('Error parsing request body', bodyParseError);
        return;
    }

    const { input: requestUrl, init } = interceptData;

    const sessionId = init?.body?.variables?.session?.sessionId;
    const vizId = init?.body?.variables?.contextBookId;

    if (defaultUrls.ANSWER_DATA.includes(requestUrl) && (viewConfig as LegacyInterceptFlags).isOnBeforeGetVizDataInterceptEnabled) {
        const answerTml = await getUnsavedAnswerTml({ sessionId, vizId });
        executeEvent(EmbedEvent.OnBeforeGetVizDataIntercept, { data: { data: answerTml } });
    }

    executeEvent(EmbedEvent.ApiIntercept, interceptData);
}

export const processLegacyInterceptResponse = (payload: any) => {

    const title = payload?.data?.errorText;
    const desc = payload?.data?.errorDescription;

    const payloadToSend = {
        execute: payload?.data?.execute,
        response: {
            body: {
                errors: [
                    {
                        errorObj: {
                            title,
                            desc
                        }
                    }
                ],
            },
            status: 200,
        }
    };

    return { data: payloadToSend };
}
