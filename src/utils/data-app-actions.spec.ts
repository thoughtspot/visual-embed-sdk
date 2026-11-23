import { readActionsRule, sameActionsOff, switchesOff } from './data-app-actions';

describe('readActionsRule', () => {
    it.each([
        ['undefined', undefined],
        ['null', null],
    ])('reads %s as no rule', (_, value) => {
        expect(readActionsRule(value)).toBeUndefined();
    });

    it.each([
        ['all', { off: 'all' }, { off: 'all' }],
        ['an empty list', { off: [] }, { off: [] }],
        ['ids, unique and sorted', { off: ['zeta', 'alpha', 'zeta', 'mid_1'] }, { off: ['alpha', 'mid_1', 'zeta'] }],
        ['display hidden', { off: 'all', display: 'hidden' }, { off: 'all', display: 'hidden' }],
        ['display disabled', { off: ['a'], display: 'disabled' }, { off: ['a'], display: 'disabled' }],
        ['display undefined, dropped', { off: ['a'], display: undefined }, { off: ['a'] }],
        ['the longest id', { off: [`a${'0'.repeat(63)}`] }, { off: [`a${'0'.repeat(63)}`] }],
        ['an object with no prototype', Object.assign(Object.create(null), { off: 'all' }), { off: 'all' }],
    ])('reads %s', (_, value, rule) => {
        expect(readActionsRule(value)).toStrictEqual(rule);
    });

    it('keeps nothing of the value it read', () => {
        const off = ['b', 'a'];
        const rule = readActionsRule({ off }) as { off: string[] };
        off.push('c');

        expect(rule.off).toEqual(['a', 'b']);
        expect(rule.off).not.toBe(off);
    });

    it.each([
        ['a string', 'all'],
        ['an array', ['a']],
        ['a function', () => ({ off: 'all' })],
        ['an empty object', {}],
        ['off missing', { display: 'hidden' }],
        ['off undefined', { off: undefined }],
        ['off a number', { off: 0 }],
        ['off another word', { off: 'some' }],
        ['off with capitals', { off: 'All' }],
        ['an id with a capital', { off: ['closeTicket'] }],
        ['an id with a dot', { off: ['close.ticket'] }],
        ['an id with a trailing newline', { off: ['close\n'] }],
        ['an id too long', { off: [`a${'0'.repeat(64)}`] }],
        ['an id that is a String object', { off: [new String('close')] }],
        ['a typed array', { off: new Uint8Array(1) }],
        ['display other', { off: 'all', display: 'none' }],
        ['display a number', { off: 'all', display: 0 }],
        ['an extra key', { off: 'all', reason: 'x' }],
        ['a Date', new Date()],
        ['a Map', new Map([['off', 'all']])],
        ['a getter that throws', Object.defineProperty({}, 'off', {
            enumerable: true,
            get() {
                throw new Error('no');
            },
        })],
        ['an id list whose iterator throws', {
            off: Object.assign(['a'], {
                [Symbol.iterator]() {
                    throw new Error('no');
                },
            }),
        }],
    ])('reads %s as malformed', (_, value) => {
        expect(readActionsRule(value)).toBe(false);
    });
});

describe('switchesOff', () => {
    it.each([
        [undefined, false],
        [{ off: [] as string[] }, false],
        [{ off: 'all' as const }, true],
        [{ off: ['a'] }, true],
    ])('%p: %p', (rule, expected) => {
        expect(switchesOff(rule)).toBe(expected);
    });
});

describe('sameActionsOff', () => {
    it.each([
        ['all', 'all', true],
        ['all', ['a'], false],
        ['all', undefined, false],
        [['a', 'b'], ['b', 'a'], true],
        [['a', 'b'], ['a', 'b', 'b'], true],
        [['a', 'b'], ['a'], false],
        [['a', 'b'], ['a', 'c'], false],
        [['a', 'b'], ['a', 'b', 'c'], false],
        [['a', 'b'], 'all', false],
        [['a'], 'a', false],
        [['a'], [['a']], false],
        [['a'], [1], false],
        [['a'], null, false],
        [['a'], { 0: 'a', length: 1 }, false],
        [[] as string[], [], true],
    ])('off %p, echo %p: %p', (off, echo, expected) => {
        expect(sameActionsOff(off as any, echo)).toBe(expected);
    });

    it('does not count a hole in the echo as an id', () => {
        const echo: string[] = new Array(2);
        echo[1] = 'a';

        expect(sameActionsOff(['a'], echo)).toBe(false);
        expect(sameActionsOff(['a', 'b'], echo)).toBe(false);
    });
});
