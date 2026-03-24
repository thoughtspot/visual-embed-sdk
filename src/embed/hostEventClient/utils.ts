import { EmbedErrorCodes, EmbedEvent, ErrorDetailsTypes, HostEvent } from '../../types';
import { ERROR_MESSAGE } from '../../errors';
import { HostEventRequest } from './contracts';
import { embedEventStatus } from '../../utils';

export function isValidUpdateFiltersPayload(
  payload: HostEventRequest<HostEvent.UpdateFilters> | undefined,
): boolean {
  if (!payload) return false;

  const isValidFilter = (f: { column?: string; oper?: string; values?: unknown[] }) =>
    !!f && typeof f.column === 'string' && typeof f.oper === 'string' && Array.isArray(f.values);

  const hasValidFilter = payload.filter && isValidFilter(payload.filter);
  const hasValidFilters = Array.isArray(payload.filters) && payload.filters.length > 0 && payload.filters.every(isValidFilter);

  return !!(hasValidFilter || hasValidFilters);
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
