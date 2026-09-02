import isNil from 'lodash/isNil';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import { EmbedErrorCodes, EmbedEvent, ErrorDetailsTypes, HostEvent } from '../../types';
import { ERROR_MESSAGE } from '../../errors';
import { ApplicabilityLevel, HostEventRequest } from './contracts';
import {
  embedEventStatus,
  convertToLegacyFilterUpdate,
  convertToLegacyRuntimeFilter,
  addFilterFieldAliases,
} from '../../utils';

const isValidApplicability = (a?: { level?: string; targetId?: string }) => {
  if (isUndefined(a)) return true;
  // targetId is not required at LIVEBOARD level, since the filter applies to the whole Liveboard
  return isPlainObject(a)
      && Object.values(ApplicabilityLevel).includes(a.level as ApplicabilityLevel)
      && (a.level === ApplicabilityLevel.Liveboard || (isString(a.targetId) && a.targetId.trim().length > 0));
};

export function isValidUpdateFiltersPayload(
  payload: HostEventRequest<HostEvent.UpdateFilters> | undefined,
): boolean {
  if (!payload) return false;

  const isValidFilter = (f: {
    column?: string;
    oper?: string;
    values?: unknown[];
    type?: string;
    columnName?: string;
    operator?: string;
    applicability?: { level?: string; targetId?: string };
  }) => {
    const hasColumn = typeof f.column === 'string' || typeof f.columnName === 'string';
    const hasOperator = typeof f.oper === 'string' || typeof f.operator === 'string';
    const hasValues = Array.isArray(f.values);
    const validType = !f.type || typeof f.type === 'string';

    return hasColumn && hasOperator && hasValues && validType && isValidApplicability(f.applicability);
  };

  const hasValidFilter = payload.filter && isValidFilter(payload.filter);
  const hasValidFilters = Array.isArray(payload.filters) && payload.filters.length > 0 && payload.filters.every(isValidFilter);

  return !!(hasValidFilter || hasValidFilters);
}

/**
 * Rewrites the filters in an UpdateFilters payload to the `column` spelling
 * the embedded application expects, so callers can use either spelling.
 * @param payload
 */
export function convertUpdateFiltersToLegacyFormat(
  payload: HostEventRequest<HostEvent.UpdateFilters>,
): HostEventRequest<HostEvent.UpdateFilters> {
  if (!isPlainObject(payload)) return payload;

  const { filter, filters } = payload;
  return {
    ...payload,
    ...(filter ? { filter: convertToLegacyFilterUpdate(filter) } : {}),
    ...(Array.isArray(filters) ? { filters: filters.map(convertToLegacyFilterUpdate) } : {}),
  };
}

/**
 * Rewrites an UpdateRuntimeFilters payload to the `columnName` spelling the
 * embedded application expects, so callers can use either spelling.
 * @param payload
 */
export function convertRuntimeFiltersToLegacyFormat<T>(payload: T): T {
  if (!Array.isArray(payload)) return payload;

  const filters = payload.map(convertToLegacyRuntimeFilter) as unknown as T;
  /*
   * LiveboardEmbed stamps vizId onto the array object itself rather than into
   * it, so carry across every own property that is not an index.
   */
  Object.keys(payload)
    .filter((key) => !(key in (filters as object)))
    .forEach((key) => {
      (filters as Record<string, unknown>)[key] = (payload as Record<string, unknown>)[key];
    });
  return filters;
}

/**
 * Stamps both column spellings onto the filters a GetFilters response carries,
 * so a filter read back can be passed to UpdateFilters or
 * UpdateRuntimeFilters without renaming.
 * @param response
 */
export function addGetFiltersFieldAliases<T>(response: T): T {
  if (!isPlainObject(response)) return response;

  const { liveboardFilters, runtimeFilters } = response as {
    liveboardFilters?: unknown[];
    runtimeFilters?: unknown[];
  };
  return {
    ...response,
    ...(Array.isArray(liveboardFilters)
      ? { liveboardFilters: liveboardFilters.map(addFilterFieldAliases) }
      : {}),
    ...(Array.isArray(runtimeFilters)
      ? { runtimeFilters: runtimeFilters.map(addFilterFieldAliases) }
      : {}),
  };
}

export function isValidUpdateParametersPayload(payload: unknown): boolean {
  // Only validates the applicability of each parameter (null treated as absent); the rest is forwarded as-is for backward compatibility.
  if (!Array.isArray(payload)) return true;
  return payload.every((p) => {
      if (!isPlainObject(p)) return true;
      const { applicability } = p as { applicability?: { level?: string; targetId?: string } };
      return isNil(applicability) || isValidApplicability(applicability);
  });
}

export function isValidDrillDownPayload(
  payload: HostEventRequest<HostEvent.DrillDown> | undefined,
): boolean {
  if (!payload) return false;

  const points = payload.points;
  if (!points || typeof points !== 'object') return false;

  const hasClickedPoint = 'clickedPoint' in points && points.clickedPoint != null;
  const hasSelectedPoints = Array.isArray(points.selectedPoints) && points.selectedPoints.length > 0;

  return hasClickedPoint || hasSelectedPoints;
}

export type ValidationError = Error & {
  isValidationError?: boolean;
  embedErrorDetails?: { type: EmbedEvent.Error; data: { errorType: ErrorDetailsTypes; message: string; code: EmbedErrorCodes; error: string }; status: typeof embedEventStatus.END };
};

export function createValidationError(message: string): never {
  const err = new Error(message) as ValidationError;
  err.isValidationError = true;
  err.embedErrorDetails = {
    type: EmbedEvent.Error,
    data:{
    errorType: ErrorDetailsTypes.VALIDATION_ERROR,
    message,
    code: EmbedErrorCodes.HOST_EVENT_VALIDATION,
    error: message
    },
    status:embedEventStatus.END
  };
  throw err;
}

export function throwUpdateFiltersValidationError(): never {
  createValidationError(ERROR_MESSAGE.UPDATEFILTERS_INVALID_PAYLOAD);
}

export function throwDrillDownValidationError(): never {
  createValidationError(ERROR_MESSAGE.DRILLDOWN_INVALID_PAYLOAD);
}

export function throwUpdateParametersValidationError(): never {
  createValidationError(ERROR_MESSAGE.UPDATEPARAMETERS_INVALID_PAYLOAD);
}
