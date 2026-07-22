import * as fs from 'fs';
import * as path from 'path';
import { ACTION_GROUPS, CASCADING_MENU_ACTIONS } from './cascading-menu-actions';

const JSON_PATH = path.join(__dirname, 'cascading-menu-actions.json');

// The JSON artifact is fetched raw (GitHub main) by the main app's drift-gate
// integration test, so it must always mirror the TS source of truth.
describe('CASCADING_MENU_ACTIONS contract', () => {
    it('generated cascading-menu-actions.json mirrors the TS source', () => {
        if (process.env.UPDATE_CASCADE_CONTRACT) {
            fs.writeFileSync(
                JSON_PATH,
                `${JSON.stringify(CASCADING_MENU_ACTIONS, null, 4)}\n`,
            );
        }
        const onDisk = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        try {
            expect(onDisk).toEqual(CASCADING_MENU_ACTIONS);
        } catch (err) {
            throw new Error(
                'cascading-menu-actions.json is out of sync with cascading-menu-actions.ts.\n' +
                    'Regenerate it with:\n' +
                    '  UPDATE_CASCADE_CONTRACT=1 npx jest src/cascading-menu-actions.spec.ts\n\n' +
                    (err as Error).message,
            );
        }
    });

    it('has no duplicate children within a surface', () => {
        Object.values(CASCADING_MENU_ACTIONS).forEach((surface) => {
            const all = Object.values(surface).flat();
            expect(new Set(all).size).toBe(all.length);
        });
    });

    it('every parent has at least two children (else it would not cascade)', () => {
        Object.values(CASCADING_MENU_ACTIONS).forEach((surface) => {
            Object.values(surface).forEach((children) => {
                expect(children.length).toBeGreaterThanOrEqual(2);
            });
        });
    });

    it('ACTION_GROUPS covers every parent as its cross-surface union', () => {
        // Tripwire: adding a new cascade parent without a matching intent-level
        // group (or with a stale one) fails here.
        const expected: Record<string, string[]> = {};
        Object.values(CASCADING_MENU_ACTIONS).forEach((surface) => {
            Object.entries(surface).forEach(([parent, children]) => {
                expected[parent] = [...(expected[parent] ?? []), ...children];
            });
        });
        const actual = Object.fromEntries(
            Object.entries(ACTION_GROUPS).map(([k, v]) => [k, [...v].sort()]),
        );
        const wanted = Object.fromEntries(
            Object.entries(expected).map(([k, v]) => [k, v.sort()]),
        );
        expect(actual).toEqual(wanted);
    });
});
