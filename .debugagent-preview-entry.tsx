import { init, AuthType } from './src/index';

init({
    thoughtSpotHost: 'https://example.thoughtspot.cloud',
    authType: AuthType.None,
    enableDebugAgent: true,
} as any);
