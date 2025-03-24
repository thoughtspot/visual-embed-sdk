// TODO: Remove this once the issue is fixed
/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'fs';
import {
    describe, it, expect, beforeEach, vi,
} from 'vitest';
import { writeToFileAsync, addPrev, appPrevKey } from '.';

const fileService = fs.promises;
// Mock the fs promises module
vi.mock('fs', () => ({
    promises: {
        writeFile: vi.fn(),
    },
}));

describe('Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('writeToFileAsync', () => {
        it('should write content to file with UTF-8 encoding', async () => {
            const path = 'test.txt';
            const content = 'Hello World';

            await writeToFileAsync(path, content);

            expect(fileService.writeFile).toHaveBeenCalledWith(path, content, 'utf8');
        });

        it('should handle empty content', async () => {
            const path = 'test.txt';
            const content = '';

            await writeToFileAsync(path, content);

            expect(fileService.writeFile).toHaveBeenCalledWith(path, content, 'utf8');
        });
    });

    describe('addPrev', () => {
        it('should add _prev reference to nested objects', () => {
            const input = {
                a: { b: 1 },
                c: [{ d: 2 }],
            };

            const result = addPrev(input);

            // Check object references
            expect(result.a[appPrevKey]).toBe(result);
            expect(result.c[0][appPrevKey]).toBe(result.c);

            // Check original values are preserved
            expect(result.a.b).toBe(1);
            expect(result.c[0].d).toBe(2);
        });

        it('should handle primitive values without modification', () => {
            const input = {
                string: 'hello',
                number: 42,
                boolean: true,
                null: null,
                undefined,
            };

            const result = addPrev(input);

            expect(result).toEqual(input);
        });

        it('should handle empty objects and arrays', () => {
            const input = {
                emptyObj: {},
                emptyArray: [],
            };

            const result = addPrev(input);

            expect(result.emptyObj[appPrevKey]).toBe(result);
            expect(result.emptyArray[appPrevKey]).toBe(result);
        });

        it('should handle deeply nested structures', () => {
            const input = {
                level1: {
                    level2: {
                        level3: {
                            value: 1,
                        },
                    },
                },
            };

            const result = addPrev(input);

            expect(result.level1[appPrevKey]).toBe(result);
            expect(result.level1.level2[appPrevKey]).toBe(result.level1);
            expect(result.level1.level2.level3[appPrevKey]).toBe(result.level1.level2);
        });

        it('should handle arrays with nested objects', () => {
            const input = {
                array: [
                    { id: 1 },
                    { id: 2, nested: { value: 3 } },
                ],
            };

            const result = addPrev(input);

            expect(result.array[appPrevKey]).toBe(undefined);
            expect(result.array[0][appPrevKey]).toBe(result);
            expect(result.array[1][appPrevKey]).toBe(result);
            expect(result.array[1]?.nested?.[appPrevKey]).toBe(result.array[1]);
        });
    });
});
