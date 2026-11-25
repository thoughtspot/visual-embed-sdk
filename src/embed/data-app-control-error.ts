import { HostEvent } from '../types';
import { DATA_APP_CONTROL_ERROR_MESSAGE } from '../errors';
import type {
    DataAppControlError as DataAppControlErrorContract,
    DataAppControlErrorCode,
    DataAppControlResult,
} from '../contracts/data-app-contracts';

// Host events that act on the App open in a DataAppEmbed.
export const DATA_APP_HOST_EVENTS: ReadonlySet<HostEvent> = new Set([
    HostEvent.GetDataAppControls,
    HostEvent.UpdateDataAppControls,
]);

// Internal: only the DataAppControlError interface is public.
export class DataAppControlError extends Error implements DataAppControlErrorContract {
    public name = 'DataAppControlError';

    public code: DataAppControlErrorCode;

    public results?: DataAppControlResult[];

    constructor(
        code: keyof typeof DATA_APP_CONTROL_ERROR_MESSAGE,
        results?: DataAppControlResult[],
    ) {
        super(DATA_APP_CONTROL_ERROR_MESSAGE[code]);
        this.code = code;
        // Absent rather than undefined when there are none.
        if (results) this.results = results;
    }
}
