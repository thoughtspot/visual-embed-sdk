import * as apiIntercept from './api-intercept';
import * as config from './config';
import * as embedConfig from './embed/embedConfig';
import { ERROR_MESSAGE } from './errors';
import { InterceptedApiType, EmbedEvent, BaseViewConfig, EmbedErrorCodes, ErrorDetailsTypes } from './types';
import { embedEventStatus } from './utils';
import { logger } from './utils/logger';

jest.mock('./config');
jest.mock('./embed/embedConfig');
jest.mock('./utils/logger');

const mockGetThoughtSpotHost = config.getThoughtSpotHost as jest.Mock;
const mockGetEmbedConfig = embedConfig.getEmbedConfig as jest.Mock;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('api-intercept', () => {
  const thoughtSpotHost = 'https://test.thoughtspot.com';
  let originalJsonParse: any;

  beforeAll(() => {
    originalJsonParse = JSON.parse;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetThoughtSpotHost.mockReturnValue(thoughtSpotHost);
    mockGetEmbedConfig.mockReturnValue({});
    // Restore JSON.parse before each test
    JSON.parse = originalJsonParse;
  });

  afterEach(() => {
    // Ensure JSON.parse is restored after each test
    JSON.parse = originalJsonParse;
  });

  describe('getInterceptInitData', () => {
    it('should return default intercept flags when no intercepts are configured', () => {
      const viewConfig: BaseViewConfig = {};

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result).toEqual({
        interceptUrls: [],
        interceptTimeout: undefined,
      });
    });

    it('should expand InterceptedApiType.AnswerData to specific URLs', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [InterceptedApiType.AnswerData]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toEqual([
        `${thoughtSpotHost}/prism/?op=GetChartWithData`,
        `${thoughtSpotHost}/prism/?op=GetTableWithHeadlineData`,
        `${thoughtSpotHost}/prism/?op=GetTableWithData`,
      ]);
    });

    it('should expand InterceptedApiType.LiveboardData to specific URLs', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [InterceptedApiType.LiveboardData]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toEqual([
        `${thoughtSpotHost}/prism/?op=LoadContextBook`
      ]);
    });

    it('should handle multiple intercept types', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [
          InterceptedApiType.AnswerData,
          InterceptedApiType.LiveboardData
        ]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toContain(`${thoughtSpotHost}/prism/?op=GetChartWithData`);
      expect(result.interceptUrls).toContain(`${thoughtSpotHost}/prism/?op=LoadContextBook`);
      expect(result.interceptUrls.length).toBe(4);
    });

    it('should handle custom URL strings', () => {
      const customUrl = '/api/custom-endpoint';
      const viewConfig: BaseViewConfig = {
        interceptUrls: [customUrl]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toEqual([`${thoughtSpotHost}${customUrl}`]);
    });

    it('should handle full URL strings', () => {
      const fullUrl = 'https://example.com/api/endpoint';
      const viewConfig: BaseViewConfig = {
        interceptUrls: [fullUrl]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toEqual([fullUrl]);
    });

    it('should handle InterceptedApiType.ALL', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [InterceptedApiType.ALL]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toEqual([InterceptedApiType.ALL]);
    });

    it('should prioritize ALL over other intercept types', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [
          InterceptedApiType.AnswerData,
          InterceptedApiType.ALL,
          '/api/custom'
        ]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toEqual([InterceptedApiType.ALL]);
    });

    it('should handle legacy isOnBeforeGetVizDataInterceptEnabled flag', () => {
      const viewConfig: any = {
        isOnBeforeGetVizDataInterceptEnabled: true
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toContain(`${thoughtSpotHost}/prism/?op=GetChartWithData`);
    });

    it('should combine legacy flag with interceptUrls', () => {
      const viewConfig: any = {
        isOnBeforeGetVizDataInterceptEnabled: true,
        interceptUrls: [InterceptedApiType.LiveboardData]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls).toContain(`${thoughtSpotHost}/prism/?op=GetChartWithData`);
      expect(result.interceptUrls).toContain(`${thoughtSpotHost}/prism/?op=LoadContextBook`);
    });

    it('should pass through interceptTimeout', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [],
        interceptTimeout: 5000
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptTimeout).toBe(5000);
    });

    it('should deduplicate URLs when same type is added multiple times', () => {
      const viewConfig: BaseViewConfig = {
        interceptUrls: [
          InterceptedApiType.AnswerData,
          InterceptedApiType.AnswerData
        ]
      };

      const result = apiIntercept.getInterceptInitData(viewConfig);

      expect(result.interceptUrls.length).toBe(3); // 3 answer data URLs
    });
  });

  describe('handleInterceptEvent', () => {
    let executeEvent: jest.Mock;
    let getUnsavedAnswerTml: jest.Mock;
    let viewConfig: BaseViewConfig;

    beforeEach(() => {
      executeEvent = jest.fn();
      getUnsavedAnswerTml = jest.fn().mockResolvedValue({ answer: { tml: 'test-tml' } });
      viewConfig = {};
    });

    it('should handle valid intercept data', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetChartWithData',
          init: {
            method: 'POST',
            body: JSON.stringify({
              variables: {
                session: { sessionId: 'session-123' },
                contextBookId: 'viz-456'
              }
            })
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.objectContaining({
          input: '/prism/?op=GetChartWithData',
          urlType: InterceptedApiType.AnswerData
        })
      );
    });

    it('should trigger legacy OnBeforeGetVizDataIntercept for answer data URLs', async () => {
      viewConfig.isOnBeforeGetVizDataInterceptEnabled = true;
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetChartWithData',
          init: {
            method: 'POST',
            body: JSON.stringify({
              variables: {
                session: { sessionId: 'session-123' },
                contextBookId: 'viz-456'
              }
            })
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(getUnsavedAnswerTml).toHaveBeenCalledWith({
        sessionId: 'session-123',
        vizId: 'viz-456'
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.OnBeforeGetVizDataIntercept,
        {
          data: {
            data: { answer: { tml: 'test-tml' } },
            status: embedEventStatus.END,
            type: EmbedEvent.OnBeforeGetVizDataIntercept
          }
        }
      );

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.any(Object)
      );
    });

    it('should not trigger legacy intercept for non-answer data URLs', async () => {
      viewConfig.isOnBeforeGetVizDataInterceptEnabled = true;
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=LoadContextBook',
          init: {
            method: 'POST',
            body: '{}'
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(getUnsavedAnswerTml).not.toHaveBeenCalled();
      expect(executeEvent).toHaveBeenCalledTimes(1);
      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.any(Object)
      );
    });

    it('should handle GetTableWithHeadlineData URL as answer data', async () => {
      viewConfig.isOnBeforeGetVizDataInterceptEnabled = true;
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetTableWithHeadlineData',
          init: {
            body: JSON.stringify({
              variables: { session: { sessionId: 'test' } }
            })
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(getUnsavedAnswerTml).toHaveBeenCalled();
    });

    it('should handle GetTableWithData URL as answer data', async () => {
      viewConfig.isOnBeforeGetVizDataInterceptEnabled = true;
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetTableWithData',
          init: {
            body: JSON.stringify({
              variables: { session: { sessionId: 'test' } }
            })
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(getUnsavedAnswerTml).toHaveBeenCalled();
    });

    it('should handle invalid JSON in event data', async () => {
      const eventData = {
        data: 'invalid-json'
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(EmbedEvent.Error, 
        expect.objectContaining({ 
          errorType: ErrorDetailsTypes.API,
          message: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
          code: EmbedErrorCodes.PARSING_API_INTERCEPT_BODY_ERROR,
          error: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
        })
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle init with non-JSON body', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/api/test',
          init: {
            method: 'POST',
            body: 'plain-text-body'
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.objectContaining({
          init: expect.objectContaining({
            body: 'plain-text-body'
          })
        })
      );
    });

    it('should handle malformed event data structure with property access error', async () => {
      // Create an object with a getter that throws when accessing 'input'
      global.JSON.parse = jest.fn().mockImplementationOnce((str) => {
        // Return an object with a getter that throws
        return new Proxy({}, {
          get(target, prop) {
            if (prop === 'input') {
              throw new Error('Property access error');
            }
            return undefined;
          }
        });
      });

      const eventData = {
        data: JSON.stringify({ input: '/test', init: {} })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(EmbedEvent.Error,
        expect.objectContaining({
          errorType: ErrorDetailsTypes.API,
          message: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
          code: EmbedErrorCodes.PARSING_API_INTERCEPT_BODY_ERROR,
          error: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
        })
      );
      expect(mockLogger.error).toHaveBeenCalled();

      // Explicitly restore for this test
      global.JSON.parse = originalJsonParse;
    });

    it('should determine urlType as ALL for unknown URLs', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/unknown/endpoint',
          init: { method: 'GET' }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.objectContaining({
          urlType: InterceptedApiType.ALL
        })
      );
    });

    it('should determine urlType as LiveboardData for liveboard URLs', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=LoadContextBook',
          init: { method: 'POST' }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.objectContaining({
          urlType: InterceptedApiType.LiveboardData
        })
      );
    });

    it('should handle event data with missing init', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetChartWithData'
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      // When init is missing, accessing init.body throws an error
      expect(executeEvent).toHaveBeenCalledWith(EmbedEvent.Error,
        expect.objectContaining({
          errorType: ErrorDetailsTypes.API,
          message: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
          code: EmbedErrorCodes.PARSING_API_INTERCEPT_BODY_ERROR,
          error: ERROR_MESSAGE.ERROR_PARSING_API_INTERCEPT_BODY,
        })
      );
    });

    it('should handle event data with missing body', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetChartWithData',
          init: {}
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.any(Object)
      );
    });

    it('should handle event data with missing variables in body', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetChartWithData',
          init: {
            body: JSON.stringify({})
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.any(Object)
      );
    });

    it('should handle event data with missing session in variables', async () => {
      const eventData = {
        data: JSON.stringify({
          input: '/prism/?op=GetChartWithData',
          init: {
            body: JSON.stringify({
              variables: {}
            })
          }
        })
      };

      await apiIntercept.handleInterceptEvent({
        eventData,
        executeEvent,
        viewConfig,
        getUnsavedAnswerTml
      });

      expect(executeEvent).toHaveBeenCalledWith(
        EmbedEvent.ApiIntercept,
        expect.any(Object)
      );
    });
  });

  describe('processApiInterceptResponse', () => {
    it('should process legacy format with error', () => {
      const legacyPayload = {
        data: {
          error: {
            errorText: 'Test Error',
            errorDescription: 'Test Description'
          },
          execute: false
        }
      };

      const result = apiIntercept.processApiInterceptResponse(legacyPayload);

      expect(result).toEqual({
        data: {
          execute: false,
          response: {
            body: {
              errors: [
                {
                  title: 'Test Error',
                  description: 'Test Description',
                  isUserError: true,
                },
              ],
              data: {},
            },
          },
        }
      });
    });

    it('should pass through new format unchanged', () => {
      const newPayload = {
        execute: true,
        response: {
          body: { data: 'test' }
        }
      };

      const result = apiIntercept.processApiInterceptResponse(newPayload);

      expect(result).toEqual(newPayload);
    });

    it('should handle payload without data property', () => {
      const payload = {
        execute: true
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle payload with data but no error', () => {
      const payload = {
        data: {
          execute: true,
          someOtherProperty: 'value'
        }
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle null payload', () => {
      const result = apiIntercept.processApiInterceptResponse(null);

      expect(result).toBeNull();
    });

    it('should handle undefined payload', () => {
      const result = apiIntercept.processApiInterceptResponse(undefined);

      expect(result).toBeUndefined();
    });

    it('should handle payload with null data', () => {
      const payload: any = {
        data: null
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle payload with data.error set to null', () => {
      const payload: any = {
        data: {
          error: null,
          execute: true
        }
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle payload with data.error set to undefined', () => {
      const payload: any = {
        data: {
          error: undefined,
          execute: true
        }
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle payload with data.error set to false', () => {
      const payload = {
        data: {
          error: false,
          execute: true
        }
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle payload with data.error set to 0', () => {
      const payload = {
        data: {
          error: 0,
          execute: true
        }
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });

    it('should handle payload with data.error set to empty string', () => {
      const payload = {
        data: {
          error: '',
          execute: true
        }
      };

      const result = apiIntercept.processApiInterceptResponse(payload);

      expect(result).toEqual(payload);
    });
  });

  describe('processLegacyInterceptResponse', () => {
    it('should convert legacy error format to new format', () => {
      const legacyPayload = {
        data: {
          error: {
            errorText: 'Custom Error',
            errorDescription: 'Custom Description'
          },
          execute: false
        }
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result).toEqual({
        data: {
          execute: false,
          response: {
            body: {
              errors: [
                {
                  title: 'Custom Error',
                  description: 'Custom Description',
                  isUserError: true,
                },
              ],
              data: {},
            },
          },
        }
      });
    });

    it('should handle missing error properties', () => {
      const legacyPayload = {
        data: {
          error: {},
          execute: true
        }
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.response.body.errors[0]).toEqual({
        title: undefined,
        description: undefined,
        isUserError: true,
      });
    });

    it('should handle missing execute property', () => {
      const legacyPayload = {
        data: {
          error: {
            errorText: 'Error',
            errorDescription: 'Description'
          }
        }
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.execute).toBeUndefined();
    });

    it('should always include empty data object', () => {
      const legacyPayload = {
        data: {
          error: {
            errorText: 'Error',
            errorDescription: 'Description'
          },
          execute: false
        }
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.response.body.data).toEqual({});
    });

    it('should always set isUserError to true', () => {
      const legacyPayload = {
        data: {
          error: {
            errorText: 'Error',
            errorDescription: 'Description'
          },
          execute: false
        }
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.response.body.errors[0].isUserError).toBe(true);
    });

    it('should handle payload with null data', () => {
      const legacyPayload: any = {
        data: null
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.execute).toBeUndefined();
      expect(result.data.response.body.errors[0].title).toBeUndefined();
      expect(result.data.response.body.errors[0].description).toBeUndefined();
    });

    it('should handle payload with null error', () => {
      const legacyPayload: any = {
        data: {
          error: null,
          execute: true
        }
      };

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.execute).toBe(true);
      expect(result.data.response.body.errors[0].title).toBeUndefined();
      expect(result.data.response.body.errors[0].description).toBeUndefined();
    });

    it('should handle payload with undefined properties', () => {
      const legacyPayload = {};

      const result = apiIntercept.processLegacyInterceptResponse(legacyPayload);

      expect(result.data.execute).toBeUndefined();
      expect(result.data.response.body.errors[0].title).toBeUndefined();
      expect(result.data.response.body.errors[0].description).toBeUndefined();
    });
  });
});

