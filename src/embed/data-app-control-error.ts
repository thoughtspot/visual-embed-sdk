import { DATA_APP_CONTROL_ERROR_MESSAGE } from '../errors';
import type {
    DataAppControlError as DataAppControlErrorContract,
    DataAppControlErrorCode,
} from '../contracts/data-app-contracts';

// Internal: only the DataAppControlError interface is public.
export class DataAppControlError extends Error implements DataAppControlErrorContract {
    public name = 'DataAppControlError';

    public code: DataAppControlErrorCode;

    constructor(code: keyof typeof DATA_APP_CONTROL_ERROR_MESSAGE) {
        super(DATA_APP_CONTROL_ERROR_MESSAGE[code]);
        this.code = code;
    }
}
