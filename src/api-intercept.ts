import { getThoughtSpotHost } from "./config";
import { getEmbedConfig } from "./embed/embedConfig";
import { InterceptedApiType, BaseViewConfig, EmbedConfig, InterceptV2Flags, EmbedEvent } from "./types";



const defaultUrls: Record<Exclude<InterceptedApiType, InterceptedApiType.ALL>, string[]> = {
    [InterceptedApiType.METADATA]: [
        '/prism/?op=CreateAnswerSession',
        '/prism/?op=GetV2SourceDetail',
    ] as string[],
    [InterceptedApiType.DATA]: [
        '/prism/?op=GetChartWithData',
        '/prism/?op=GetTableWithHeadlineData',
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

const processInterceptUrls = (combinedUrls: (string | InterceptedApiType)[]) => {
    Object.entries(defaultUrls).forEach(([apiType, apiTypeUrls]) => {
        if (!combinedUrls.includes(apiType)) return;
        combinedUrls = combinedUrls.filter(url => url !== apiType);
        combinedUrls = [...combinedUrls, ...apiTypeUrls];
    })
    return combinedUrls.map(url => formatInterceptUrl(url));
}
export const getInterceptInitData = (embedConfig: EmbedConfig, viewConfig: BaseViewConfig): InterceptV2Flags => {

    const enableApiIntercept = (embedConfig.enableApiIntercept || viewConfig.enableApiIntercept) && (viewConfig.enableApiIntercept !== false);

    if (!enableApiIntercept) return {
        enableApiIntercept: false,
    };

    const combinedUrls = [...(embedConfig.interceptUrls || []), ...(viewConfig.interceptUrls || [])];

    if ((viewConfig as LegacyInterceptFlags).isOnBeforeGetVizDataInterceptEnabled) {
        combinedUrls.push(InterceptedApiType.DATA);
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

    if (defaultUrls.DATA.includes(requestUrl) && (viewConfig as LegacyInterceptFlags).isOnBeforeGetVizDataInterceptEnabled) {
        const answerTml = await getUnsavedAnswerTml({ sessionId, vizId });
        executeEvent(EmbedEvent.OnBeforeGetVizDataIntercept, { data: { data: answerTml } });
    }

    executeEvent(EmbedEvent.ApiIntercept, interceptData);
}

export const processLegacyInterceptResponse = (payload: any) => {

    const title = payload?.data?.errorText;
    const desc = payload?.data?.errorDescription;

    const payloadToSend = [{
        data: {},
        errors: [
            {
                errorObj: {
                    title,
                    desc
                }
            }
        ],
    }];

    return payloadToSend;
}
