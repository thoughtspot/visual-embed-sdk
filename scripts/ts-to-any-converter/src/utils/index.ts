import * as fs from 'fs';

const fileService = fs.promises;

/**
 * Writes content to a file asynchronously using UTF-8 encoding
 * @param {string} path - The file path where content will be written
 * @param {string} content - The string content to write to the file
 * @returns {Promise<void>} Promise that resolves when the write operation completes
 */
export const writeToFileAsync = async (path: string, content: string): Promise<void> => fileService.writeFile(path, content, 'utf8');

export const appPrevKey = '_prev';
/**
 * Recursively adds a '_prev' reference to each nested object and array element in the
 * given object, pointing to its parent object.
 * @template T - The type of the input object
 * @param {T} obj - The object to process
 * @returns {T} The processed object with '_prev' references added
 * @example
 * const data = {
 *   a: { b: 1 },
 *   c: [{ d: 2 }]
 * };
 * const result = addPrev(data);
 * // result.a._prev === data
 * // result.c[0]._prev === result.c
 */
export const addPrev = <T>(obj: T): T => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    Object.keys(obj).forEach((key) => {
        const child = obj[key];

        if (Array.isArray(child)) {
            child.forEach((item, idx) => {
                obj[key][idx] = addPrev(item);
                // eslint-disable-next-line no-underscore-dangle
                obj[key][idx][appPrevKey] = obj;
            });
        } else if (typeof child === 'object') {
            obj[key] = addPrev(obj[key]);
            // eslint-disable-next-line no-underscore-dangle
            obj[key][appPrevKey] = obj;
        }
    });
    return obj;
};
