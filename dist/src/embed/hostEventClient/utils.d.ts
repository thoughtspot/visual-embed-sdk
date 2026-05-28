import { EmbedErrorCodes, EmbedEvent, ErrorDetailsTypes, HostEvent } from '../../types';
import { HostEventRequest } from './contracts';
import { embedEventStatus } from '../../utils';
export declare function isValidUpdateFiltersPayload(payload: HostEventRequest<HostEvent.UpdateFilters> | undefined): boolean;
export declare function isValidDrillDownPayload(payload: HostEventRequest<HostEvent.DrillDown> | undefined): boolean;
export type ValidationError = Error & {
    isValidationError?: boolean;
    embedErrorDetails?: {
        type: EmbedEvent.Error;
        data: {
            errorType: ErrorDetailsTypes;
            message: string;
            code: EmbedErrorCodes;
            error: string;
        };
        status: typeof embedEventStatus.END;
    };
};
export declare function createValidationError(message: string): never;
export declare function throwUpdateFiltersValidationError(): never;
export declare function throwDrillDownValidationError(): never;
//# sourceMappingURL=utils.d.ts.map