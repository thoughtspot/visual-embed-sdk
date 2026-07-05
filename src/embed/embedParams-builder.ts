/**
 * Declarative viewConfig -> embedParams mapping.
 *
 * This is the single place that knows which viewConfig fields become which
 * embedParams keys in the APP_INIT payload. Each field is one row in
 * EMBED_PARAM_FIELDS: trivial fields are pass-throughs; a field that needs
 * transformation/validation gets its own resolver. Adding a new embedParams
 * field is a one-row change here - the base class and embed subclasses are
 * untouched.
 *
 * The base class (TsEmbed.getDefaultAppInitData) calls buildEmbedParamsPayload()
 * exactly once for every embed type.
 */

import { ErrorDetailsTypes, EmbedErrorCodes } from '../types';
import type { VisualizationOverrides } from '../types';
import { validateHttpUrl } from '../utils';
import { ERROR_MESSAGE } from '../errors';
import type { SpotterVizConfig } from './spotter-viz-utils';
import type { SpotterSidebarViewConfig } from './conversation';
import { resolveEnablePastConversationsSidebar } from './spotter-utils';

/**
 * The shape of the `embedParams` object sent inside APP_INIT. These keys are a
 * contract with the consuming application - rename with care.
 */
export interface EmbedParamsPayload {
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    spotterVizConfig?: SpotterVizConfig;
    visualOverridesParams?: VisualizationOverrides | null;
}

/**
 * The viewConfig fields that feed embedParams. All optional, so any embed's
 * viewConfig is structurally assignable here (one cast at the base-class
 * boundary covers the fact that the base ViewConfig type omits these).
 */
export interface EmbedParamsSourceConfig {
    spotterSidebarConfig?: SpotterSidebarViewConfig;
    enablePastConversationsSidebar?: boolean;
    visualOverrides?: VisualizationOverrides;
    spotterViz?: SpotterVizConfig;
}

/**
 * Pulls a value for one embedParams field out of the viewConfig. Returning
 * `undefined` omits the field from the payload.
 */
type EmbedParamResolver = (
    viewConfig: EmbedParamsSourceConfig,
    handleError: (err: any) => void,
) => unknown;

/**
 * Pass-through resolver: emit viewConfig[from] unchanged. `null` is treated as
 * "not set" so the field is omitted rather than sent as null.
 */
const passthrough = (from: keyof EmbedParamsSourceConfig): EmbedParamResolver =>
    (viewConfig) => viewConfig[from] ?? undefined;

/**
 * Resolver for spotterSidebarConfig - the one field with real logic. It folds
 * the legacy standalone `enablePastConversationsSidebar` flag into the config
 * and validates `spotterDocumentationUrl`, stripping it and reporting an error
 * when the URL is invalid. Returns `undefined` when no sidebar config applies.
 */
const resolveSpotterSidebarConfig: EmbedParamResolver = (viewConfig, handleError) => {
    const { spotterSidebarConfig, enablePastConversationsSidebar } = viewConfig;

    const resolvedEnablePastConversations = resolveEnablePastConversationsSidebar({
        spotterSidebarConfigValue: spotterSidebarConfig?.enablePastConversationsSidebar,
        standaloneValue: enablePastConversationsSidebar,
    });

    if (!spotterSidebarConfig && resolvedEnablePastConversations === undefined) {
        return undefined;
    }

    const resolved: SpotterSidebarViewConfig = {
        ...spotterSidebarConfig,
        ...(resolvedEnablePastConversations !== undefined && {
            enablePastConversationsSidebar: resolvedEnablePastConversations,
        }),
    };

    if (resolved.spotterDocumentationUrl !== undefined) {
        const [isValid, validationError] = validateHttpUrl(resolved.spotterDocumentationUrl);
        if (!isValid) {
            handleError({
                errorType: ErrorDetailsTypes.VALIDATION_ERROR,
                message: ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
                code: EmbedErrorCodes.INVALID_URL,
                error: validationError?.message || ERROR_MESSAGE.INVALID_SPOTTER_DOCUMENTATION_URL,
            });
            delete resolved.spotterDocumentationUrl;
        }
    }

    return resolved;
};

/**
 * The declarative table: one row per embedParams field. `key` is the output
 * key in the payload; `resolve` produces its value from the viewConfig. Add a
 * field by adding a row - nothing else changes.
 */
const EMBED_PARAM_FIELDS: ReadonlyArray<{
    key: keyof EmbedParamsPayload;
    resolve: EmbedParamResolver;
}> = [
    { key: 'spotterVizConfig', resolve: passthrough('spotterViz') },
    { key: 'visualOverridesParams', resolve: passthrough('visualOverrides') },
    { key: 'spotterSidebarConfig', resolve: resolveSpotterSidebarConfig },
];

/**
 * Builds the embedParams payload for a viewConfig by running every field
 * resolver and keeping the ones that produced a value. Returns `undefined` when
 * nothing applies, so embedParams is omitted from APP_INIT entirely.
 */
export function buildEmbedParamsPayload(
    viewConfig: EmbedParamsSourceConfig,
    handleError: (err: any) => void,
): EmbedParamsPayload | undefined {
    const payload: EmbedParamsPayload = {};

    for (const { key, resolve } of EMBED_PARAM_FIELDS) {
        const value = resolve(viewConfig, handleError);
        if (value !== undefined) {
            payload[key] = value as never;
        }
    }

    return Object.keys(payload).length > 0 ? payload : undefined;
}
