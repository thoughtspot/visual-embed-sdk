import { MessageChannel as NodeMessageChannel } from 'worker_threads';
import {
    UNSENDABLE_CONTROLS,
    canonicalJson,
    controlsKey,
    packInitialControls,
} from './data-app-controls';

const depot = [{ id: 'depot', value: { op: 'in', values: ['Austin'] } }];

// A browser copies a posted message, or throws DataCloneError.
const browserCopy = (value: unknown) => {
    const { port1, port2 } = new NodeMessageChannel();
    try {
        port1.postMessage(value);
    } finally {
        port1.close();
        port2.close();
    }
    return value;
};

const cyclic = () => {
    const value: any = { op: 'in' };
    value.self = value;
    return value;
};

describe('canonicalJson', () => {
    test('sorts object keys at every depth and keeps array order', () => {
        expect(canonicalJson({ b: 1, a: { d: [2, 1], c: null } })).toBe('{"a":{"c":null,"d":[2,1]},"b":1}');
        expect(canonicalJson([{ y: 1, x: 2 }, 'z'])).toBe('[{"x":2,"y":1},"z"]');
    });

    test('gives one text for the same value in another key order', () => {
        expect(canonicalJson({ op: 'in', values: ['Austin'] }))
            .toBe(canonicalJson({ values: ['Austin'], op: 'in' }));
    });

    test.each([
        ['a cycle', cyclic()],
        ['a BigInt', BigInt(1)],
        ['a BigInt inside a value', { n: BigInt(1) }],
    ])('gives the same text, which no JSON text equals, for %s', (_, value) => {
        expect(canonicalJson(value)).toBe('#');
        expect(canonicalJson(value)).toBe(canonicalJson(value));
        expect(() => JSON.parse(canonicalJson(value))).toThrow();
    });
});

describe('controlsKey', () => {
    test('gives one key for undefined, null and an empty array', () => {
        expect(controlsKey(undefined)).toBe(controlsKey(null));
        expect(controlsKey([])).toBe(controlsKey(null));
    });

    test('ignores key order and tells other values apart', () => {
        expect(controlsKey([{ value: { values: ['Austin'], op: 'in' }, id: 'depot' }])).toBe(controlsKey(depot));
        expect(controlsKey([{ id: 'depot', value: null }])).not.toBe(controlsKey(depot));
        expect(controlsKey(depot)).not.toBe(controlsKey([]));
    });

    test('is stable for a value JSON cannot hold (CR-6)', () => {
        const big = () => [{ id: 'depot', value: { n: BigInt(1) } }];

        expect(controlsKey(big())).toBe(controlsKey(big()));
    });
});

describe('packInitialControls', () => {
    const realMessageChannel = window.MessageChannel;
    let channels: NodeMessageChannel[];

    beforeEach(() => {
        channels = [];
    });

    afterEach(() => {
        delete (window as any).structuredClone;
        window.MessageChannel = realMessageChannel;
        channels.forEach(({ port1, port2 }) => {
            port1.close();
            port2.close();
        });
    });

    // A browser's MessageChannel, for when structuredClone is missing.
    const useBrowserChannel = () => {
        window.MessageChannel = function BrowserChannel() {
            const channel = new NodeMessageChannel();
            channels.push(channel);
            return channel;
        } as any;
    };

    test.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty array', []],
    ])('packs nothing for %s', (_, controls) => {
        expect(packInitialControls('a1b2', controls)).toBeUndefined();
    });

    test('packs a list with its App id, the list untouched', () => {
        const packed = packInitialControls('a1b2', depot);

        expect(packed).toStrictEqual({ appId: 'a1b2', controls: depot });
        expect(packed.controls).toBe(depot);
    });

    test.each([
        ['a map', { depot: { op: 'in' } }],
        ['an empty map', {}],
        ['a string', 'depot'],
        ['zero', 0],
        ['false', false],
    ])('packs %s as given, for the App page to refuse', (_, controls) => {
        expect(packInitialControls('a1b2', controls)).toStrictEqual({ appId: 'a1b2', controls });
    });

    test('marks values for no App page to take: not an array', () => {
        expect(Array.isArray(UNSENDABLE_CONTROLS)).toBe(false);
        expect(UNSENDABLE_CONTROLS).toBe('UNSENDABLE');
    });

    test.each([
        ['a Proxy', () => new Proxy(depot, {})],
        ['a function in a value', () => [{ id: 'depot', value: { format: () => 'x' } }]],
        ['a Symbol in a value', () => [{ id: 'depot', value: { op: Symbol('in') } }]],
    ])('packs the marker for %s, which structuredClone cannot copy', (_, controls) => {
        (window as any).structuredClone = browserCopy;

        expect(packInitialControls('a1b2', controls())).toStrictEqual({
            appId: 'a1b2',
            controls: UNSENDABLE_CONTROLS,
        });
    });

    test('packs the marker for a Proxy when only a MessageChannel can check (D19)', () => {
        useBrowserChannel();

        expect(packInitialControls('a1b2', new Proxy(depot, {}))).toStrictEqual({
            appId: 'a1b2',
            controls: UNSENDABLE_CONTROLS,
        });
        expect(packInitialControls('a1b2', depot)).toStrictEqual({ appId: 'a1b2', controls: depot });
        expect(channels).toHaveLength(2);
    });

    test('packs values structuredClone copies as given', () => {
        const clone = jest.fn(browserCopy);
        (window as any).structuredClone = clone;

        expect(packInitialControls('a1b2', depot)).toStrictEqual({ appId: 'a1b2', controls: depot });
        expect(clone).toHaveBeenCalledWith(depot);
    });

    test.each([
        ['a TypeError', new TypeError('Not supported')],
        ['a string', 'failed'],
        ['null', null],
    ])('counts only DataCloneError: values are packed as given when the check throws %s', (_, thrown) => {
        (window as any).structuredClone = () => {
            throw thrown;
        };
        const proxy = new Proxy(depot, {});

        expect(packInitialControls('a1b2', proxy).controls).toBe(proxy);
    });

    test('packs values as given when no check can run: the setup\'s MessageChannel cannot post (D19)', () => {
        const proxy = new Proxy(depot, {});

        expect(packInitialControls('a1b2', proxy).controls).toBe(proxy);
    });
});
