// JSON with sorted object keys. Every value JSON cannot hold (a cycle, a
// BigInt) gives '#', which no JSON text equals.
export const canonicalJson = (value: unknown): string => {
    try {
        return `${JSON.stringify(value, (_key, entry) => (
            entry && typeof entry === 'object' && !Array.isArray(entry)
                ? Object.keys(entry).sort().reduce((sorted: any, key) => {
                    sorted[key] = entry[key];
                    return sorted;
                }, {})
                : entry))}`;
    } catch (e) {
        return '#';
    }
};

// undefined, null and [] all mean no controls.
export const controlsKey = (controls: unknown): string => canonicalJson(controls ?? []);

// Sent in place of values the browser cannot post to the frame. Not an array,
// so every App page refuses the open.
export const UNSENDABLE_CONTROLS = 'UNSENDABLE';

// False only when the browser refuses to copy the value (a Proxy, a function).
const canPost = (value: unknown): boolean => {
    try {
        if (typeof structuredClone === 'function') structuredClone(value);
        else new MessageChannel().port1.postMessage(value);
    } catch (error) {
        return error?.name !== 'DataCloneError';
    }
    return true;
};

// The load-time values as sent, or undefined for none. Any other value is
// sent as given, so the App page refuses the open.
export const packInitialControls = (
    appId: string,
    controls: unknown,
): { appId: string; controls: unknown } | undefined => (
    controls == null || (Array.isArray(controls) && !controls.length)
        ? undefined
        : { appId, controls: canPost(controls) ? controls : UNSENDABLE_CONTROLS }
);
