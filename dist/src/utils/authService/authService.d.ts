export declare const EndPoints: {
    AUTH_VERIFICATION: string;
    SESSION_INFO: string;
    PREAUTH_INFO: string;
    SAML_LOGIN_TEMPLATE: (targetUrl: string) => string;
    OIDC_LOGIN_TEMPLATE: (targetUrl: string) => string;
    TOKEN_LOGIN: string;
    BASIC_LOGIN: string;
    LOGOUT: string;
    EXECUTE_TML: string;
    EXPORT_TML: string;
    IS_ACTIVE: string;
};
/**
 * Service to validate a auth token against a ThoughtSpot host.
 * @param thoughtSpotHost : ThoughtSpot host to verify the token against.
 * @param authToken : Auth token to verify.
 */
export declare function verifyTokenService(thoughtSpotHost: string, authToken: string): Promise<boolean>;
/**
 *
 * @param authEndpoint
 */
export declare function fetchAuthTokenService(authEndpoint: string): Promise<any>;
/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param authToken
 */
export declare function fetchAuthService(thoughtSpotHost: string, username: string, authToken: string): Promise<any>;
/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param authToken
 */
export declare function fetchAuthPostService(thoughtSpotHost: string, username: string, authToken: string): Promise<any>;
/**
 *
 * @param thoughtSpotHost
 * @param username
 * @param password
 */
export declare function fetchBasicAuthService(thoughtSpotHost: string, username: string, password: string): Promise<any>;
//# sourceMappingURL=authService.d.ts.map