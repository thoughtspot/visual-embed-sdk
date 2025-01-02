import EventEmitter from 'eventemitter3';
import { AuthEvent, AuthFailureType, AuthStatus } from 'src/auth';
import { getAuthenticationToken, resetCachedAuthToken } from 'src/authToken';
import { getMobileEmbedConfig } from 'src/embed/embedConfig';
import { WebViewConfig } from './types';
import { AuthType } from 'src/types';
import { isActiveService } from 'src/utils/authService/tokenizedAuthService';
import { fetchBasicAuthService } from 'src/utils/authService';



let loggedInStatus = false;
let authPromise: Promise<boolean> | null = null;
let authEE: EventEmitter<AuthStatus | AuthEvent> | null = null;

/**
 * Set or get the global EventEmitter used for auth events.
 */
export function setAuthEE(eventEmitter: EventEmitter<AuthStatus | AuthEvent>) {
  authEE = eventEmitter;
}
export function getAuthEE() {
  return authEE;
}

/**
 * Notify that SDK-based auth has succeeded.
 */
function notifyAuthSDKSuccess() {
  if (!authEE) {
    logger.error('SDK not initialized');
    return;
  }
  authEE.emit(AuthStatus.SDK_SUCCESS);
}

/**
 * Notify that authentication has failed.
 */
function notifyAuthFailure(failureType: AuthFailureType) {
  if (!authEE) {
    logger.error('SDK not initialized');
    return;
  }
  authEE.emit(AuthStatus.FAILURE, failureType);
}

/**
 * The main handleAuth function to trigger authentication.
 */
export function handleAuth(): Promise<boolean> {
  const embedConfig = getMobileEmbedConfig();
  // Clear any existing tokens if needed
  resetCachedAuthToken();

  // Start authentication
  authPromise = authenticate(embedConfig);
  authPromise.then(
    (isLoggedIn) => {
      if (!isLoggedIn) {
        notifyAuthFailure(AuthFailureType.SDK);
      } else {
        notifyAuthSDKSuccess();
      }
    },
    () => {
      notifyAuthFailure(AuthFailureType.SDK);
    },
  );

  return authPromise;
}

/**
 * Returns whether we are currently authenticated.
 */
export function isAuthenticated(): boolean {
  return loggedInStatus;
}

/**
 * The main authenticate function. Only supports the following:
 * - TrustedAuthTokenCookieless
 * - Basic
 * - None
 */
async function authenticate(embedConfig: WebViewConfig): Promise<boolean> {
  switch (embedConfig.authType) {
    case AuthType.TrustedAuthTokenCookieless:
      return doCookielessTokenAuth(embedConfig);
    case AuthType.Basic:
      return doBasicAuth(embedConfig);
    case AuthType.None:
    default:
      loggedInStatus = true;
      return true;
  }
}

/**
 * Cookieless token-based auth.
 * Checks if we already have a valid session;
 * if not, fetches a token and ensures it's usable.
 */
async function doCookielessTokenAuth(embedConfig: WebViewConfig): Promise<boolean> {
  const { thoughtSpotHost } = embedConfig;
  if (await isActiveService(thoughtSpotHost)) {
    loggedInStatus = true;
    return true;
  }

  const authToken = await getAuthenticationToken(embedConfig);
  if (!authToken) {
    loggedInStatus = false;
    return false;
  }

  loggedInStatus = true;
  return loggedInStatus;
}

/**
 * Basic auth flow. To be Used only during Development.
 * Warning: Avoid using in Production.
 */
async function doBasicAuth(embedConfig: WebViewConfig): Promise<boolean> {
  const { thoughtSpotHost, username, password } = embedConfig;

  if (await isActiveService(thoughtSpotHost)) {
    loggedInStatus = true;
    return true;
  }

  const response = await fetchBasicAuthService(thoughtSpotHost, username, password);
  loggedInStatus = response.ok;
  return loggedInStatus;
}
