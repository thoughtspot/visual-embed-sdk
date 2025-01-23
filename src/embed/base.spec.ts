/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
import EventEmitter from 'eventemitter3';
import { EmbedConfig } from '../index';
import * as auth from '../auth';
import * as authService from '../utils/authService/authService';
import * as authTokenService from '../authToken';
import * as index from '../index';
import * as base from './base';
import * as embedConfigInstance from './embedConfig';

import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
    getIFrameSrc,
} from '../test/test-utils';
import * as tokenizedFetchInstance from '../tokenizedFetch';
import { logger } from '../utils/logger';

const thoughtSpotHost = 'tshost';
let authEE: EventEmitter;

describe.skip('Base without init', () => {
    test('notify should error when called without init', () => {
        base.reset();
        jest.spyOn(logger, 'error').mockImplementation(() => undefined);
        base.notifyAuthSuccess();
        base.notifyAuthFailure(auth.AuthFailureType.SDK);
        base.notifyLogout();
        base.notifyAuthSDKSuccess();
        expect(logger.error).toHaveBeenCalledTimes(4);
    });
});
