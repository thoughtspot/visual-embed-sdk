let unique = 0;

// JSON with sorted object keys. A value JSON cannot hold (a cycle, a BigInt)
// matches nothing, itself included.
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
        unique += 1;
        return `#${unique}`;
    }
};

// undefined, null and [] all mean no controls.
export const controlsKey = (controls: unknown): string => canonicalJson(controls ?? []);

// The load-time values as sent, or undefined for none. Anything else is sent
// as given, so the App page refuses the open.
export const packInitialControls = (
    appId: string,
    controls: unknown,
): { appId: string; controls: unknown } | undefined => (
    controls == null || (Array.isArray(controls) && !controls.length)
        ? undefined
        : { appId, controls }
);
