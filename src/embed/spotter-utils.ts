import { DefaultAppInitData, ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import type {
    SpotterSidebarViewConfig,
    SpotterShareConversationConfig,
    SpotterChatViewConfig,
    StarterPromptsConfig,
} from './conversation';
import type { VisualizationOverrides } from '../types';

/**
 * APP_INIT data contributed by the Spotter sidebar and visual overrides config.
 * @internal
 */
export interface SpotterSidebarAppInitData {
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    visualOverridesParams?: VisualizationOverrides | null;
}

/**
 * APP_INIT data contributed by the share conversation config.
 * @internal
 */
export interface SpotterShareConversationAppInitData {
    spotterShareConversationConfig?: SpotterShareConversationConfig;
}

/**
 * APP_INIT data contributed by the starter prompts config.
 * @internal
 */
export interface StarterPromptsAppInitData {
    starterPrompts?: StarterPromptsConfig;
}

/**
 * Resolves enablePastConversationsSidebar with
 * spotterSidebarConfig taking precedence over the
 * standalone flag.
 */
export const resolveEnablePastConversationsSidebar = (params: {
    spotterSidebarConfigValue?: boolean;
    standaloneValue?: boolean;
}): boolean | undefined => (
    params.spotterSidebarConfigValue !== undefined
        ? params.spotterSidebarConfigValue
        : params.standaloneValue
);

/**
 * Drops `spotterDocumentationUrl` from the sidebar config when it is not a valid
 * HTTP URL and reports a validation error, so an unusable URL is never forwarded
 * to the app.
 * @param sidebarConfig Sidebar config to validate.
 * @param handleError Callback invoked with the validation error details.
 */
const validateSpotterDocumentationUrl = (
    sidebarConfig: SpotterSidebarViewConfig,
    handleError: (err: any) => void,
): SpotterSidebarViewConfig => {
    const { spotterDocumentationUrl } = sidebarConfig;
    if (spotterDocumentationUrl === undefined) return sidebarConfig;

    const [isValid, validationError] = validateHttpUrl(spotterDocumentationUrl);
    if (isValid) return sidebarConfig;

    handleError({
        errorType: ErrorDetailsTypes.VALIDATION_ERROR,
        message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
        code: EmbedErrorCodes.INVALID_URL,
        error: validationError?.message || ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
    });

    const { spotterDocumentationUrl: invalidUrl, ...restOfSidebarConfig } = sidebarConfig;
    return restOfSidebarConfig;
};

/**
 * Builds the `spotterSidebarConfig` and `visualOverridesParams` fragment of the
 * APP_INIT payload so the conv-assist app can read them on initialization.
 *
 * Precedence for `enablePastConversationsSidebar`:
 * `spotterSidebarConfig.enablePastConversationsSidebar` wins over the deprecated
 * top-level `enablePastConversationsSidebar` flag; if the former is absent the
 * latter is used as a fallback.
 *
 * Returns an empty fragment when neither the sidebar config nor the visual
 * overrides are set on the view config.
 * @param viewConfig View config the sidebar options are read from.
 * @param handleError Callback invoked with validation error details.
 */
export function buildSpotterSidebarAppInitData(
    viewConfig: {
        spotterSidebarConfig?: SpotterSidebarViewConfig;
        enablePastConversationsSidebar?: boolean;
        visualOverrides?: VisualizationOverrides;
    },
    handleError: (err: any) => void,
): SpotterSidebarAppInitData {
    const { spotterSidebarConfig, enablePastConversationsSidebar, visualOverrides } = viewConfig;

    const enablePastConversations = resolveEnablePastConversationsSidebar({
        spotterSidebarConfigValue: spotterSidebarConfig?.enablePastConversationsSidebar,
        standaloneValue: enablePastConversationsSidebar,
    });
    const hasSidebarConfig = !!spotterSidebarConfig || enablePastConversations !== undefined;

    return {
        ...(visualOverrides !== undefined && { visualOverridesParams: visualOverrides }),
        ...(hasSidebarConfig && {
            spotterSidebarConfig: validateSpotterDocumentationUrl({
                ...spotterSidebarConfig,
                ...(enablePastConversations !== undefined && {
                    enablePastConversationsSidebar: enablePastConversations,
                }),
            }, handleError),
        }),
    };
}

/**
 * Builds the `spotterShareConversationConfig` fragment of the APP_INIT payload
 * so the app can read the share conversation options on initialization.
 *
 * Returns an empty fragment when the config is not set on the view config.
 * @param viewConfig View config the share conversation options are read from.
 */
export function buildSpotterShareConversationAppInitData(
    viewConfig: { spotterShareConversationConfig?: SpotterShareConversationConfig },
): SpotterShareConversationAppInitData {
    const { spotterShareConversationConfig } = viewConfig;
    if (!spotterShareConversationConfig) return {};

    return { spotterShareConversationConfig };
}

/**
 * Builds the `starterPrompts` fragment of the APP_INIT payload so the app can
 * read the starter prompt categories on initialization.
 *
 * Returns an empty fragment when `spotterChatConfig.starterPrompts` is not set
 * on the view config.
 * @param viewConfig View config the starter prompts are read from.
 */
export function buildStarterPromptsAppInitData(
    viewConfig: { spotterChatConfig?: SpotterChatViewConfig },
): StarterPromptsAppInitData {
    const starterPrompts = viewConfig.spotterChatConfig?.starterPrompts;
    if (!starterPrompts) return {};

    return { starterPrompts };
}
