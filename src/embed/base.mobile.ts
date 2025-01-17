import { EmbedConfig } from 'src/types';
import { handleAuth } from '../embed/base';

export const init = (embedConfig: EmbedConfig) => {
    // sanity(embedConfig);
    // resetCachedAuthToken();
    // embedConfig = setEmbedConfig(
    //     backwardCompat({
    //         ...CONFIG_DEFAULTS,
    //         ...embedConfig,
    //         thoughtSpotHost: getThoughtSpotHost(embedConfig),
    //     }),
    // );
    const x = 'shillooe-olio';
    // setGlobalLogLevelOverride(embedConfig.logLevel);
    // registerReportingObserver();

    // const authEE = new EventEmitter<AuthStatus | AuthEvent>();
    // setAuthEE(authEE);
    handleAuth();

    // const { password, ...configToTrack } = getEmbedConfig();
    // uploadMixpanelEvent(MIXPANEL_EVENT.VISUAL_SDK_CALLED_INIT, {
    //     ...configToTrack,
    // usedCustomizationSheet: embedConfig.customizations?.style?.customCSSUrl
    // != null, usedCustomizationVariables:
    // embedConfig.customizations?.style?.customCSS?.variables != null,
    // usedCustomizationRules:
    // embedConfig.customizations?.style?.customCSS?.rules_UNSTABLE != null,
    // usedCustomizationStrings: !!embedConfig.customizations?.content?.strings,
    // usedCustomizationIconSprite: !!embedConfig.customizations?.iconSpriteUrl,
    // });

    // if (getEmbedConfig().callPrefetch) {
    //     prefetch(getEmbedConfig().thoughtSpotHost);
    // }
    return x;
};
