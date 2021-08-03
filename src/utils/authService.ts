// eslint-disable-next-line import/no-cycle
import { EndPoints } from '../auth';

export function fetchSessionInfoService(
    authVerificationUrl: string,
): Promise<any> {
    return fetch(authVerificationUrl, {
        credentials: 'include',
    });
}

export async function fetchAuthTokenService(
    authEndpoint: string,
): Promise<any> {
    return fetch(authEndpoint);
}

export async function fetchAuthService(
    thoughtSpotHost: string,
    username: string,
    authToken: string,
): Promise<any> {
    return fetch(
        `${thoughtSpotHost}${EndPoints.TOKEN_LOGIN}?username=${username}&auth_token=${authToken}`,
        {
            credentials: 'include',
        },
    );
}

export async function fetchBasicAuthService(
    thoughtSpotHost: string,
    username: string,
    password: string,
): Promise<any> {
    return fetch(`${thoughtSpotHost}${EndPoints.BASIC_LOGIN}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-requested-by': 'ThoughtSpot',
        },
        body: `username=${encodeURIComponent(
            username,
        )}&password=${encodeURIComponent(password)}`,
        credentials: 'include',
    });
}
