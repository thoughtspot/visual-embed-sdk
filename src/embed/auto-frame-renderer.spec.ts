import { startAutoMCPFrameRenderer } from './auto-frame-renderer';
import { Param, AuthType } from '../types';
import { init } from '../index';
import * as authInstance from '../auth';
import { TsEmbed } from './ts-embed';
import {
    getDocumentBody,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';

describe('startAutoMCPFrameRenderer', () => {
    let renderIFrameSpy: jest.SpyInstance;
    let getEmbedBasePathSpy: jest.SpyInstance;

    beforeAll(() => {
        init({
            thoughtSpotHost,
            authType: AuthType.None,
        });
        jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(undefined));
        jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    });

    beforeEach(() => {
        document.body.innerHTML = getDocumentBody();
        getEmbedBasePathSpy = jest.spyOn(
            TsEmbed.prototype as any,
            'getEmbedBasePath',
        ).mockImplementation(function (this: any, query: string) {
            return `http://${thoughtSpotHost}/?${query}#`;
        });
        renderIFrameSpy = jest.spyOn(
            TsEmbed.prototype as any,
            'renderIFrame',
        ).mockResolvedValue(undefined);
    });

    afterEach(() => {
        renderIFrameSpy.mockRestore();
        getEmbedBasePathSpy.mockRestore();
    });

    describe('MutationObserver setup', () => {
        test('should return a MutationObserver', () => {
            const observer = startAutoMCPFrameRenderer();
            expect(observer).toBeInstanceOf(MutationObserver);
            observer.disconnect();
        });

        test('should observe document.body with childList and subtree', () => {
            const observeSpy = jest.spyOn(MutationObserver.prototype, 'observe');
            const observer = startAutoMCPFrameRenderer();
            expect(observeSpy).toHaveBeenCalledWith(document.body, {
                childList: true,
                subtree: true,
            });
            observer.disconnect();
            observeSpy.mockRestore();
        });
    });

    describe('iframe detection via tsmcp param', () => {
        test('should process directly-added iframes with tsmcp=true', async () => {
            const observer = startAutoMCPFrameRenderer();

            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/v2/?${Param.Tsmcp}=true#/embed/viz/lb1/tab1`;
            document.body.appendChild(iframe);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).toHaveBeenCalled();
            observer.disconnect();
        });

        test('should not process iframes without tsmcp param', async () => {
            const observer = startAutoMCPFrameRenderer();

            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/v2/?embedApp=true#/embed/viz/lb1`;
            document.body.appendChild(iframe);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).not.toHaveBeenCalled();
            observer.disconnect();
        });

        test('should process tsmcp iframes nested inside added elements', async () => {
            const observer = startAutoMCPFrameRenderer();

            const wrapper = document.createElement('div');
            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/?${Param.Tsmcp}=true`;
            wrapper.appendChild(iframe);
            document.body.appendChild(wrapper);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).toHaveBeenCalled();
            observer.disconnect();
        });

        test('should not process nested iframes without tsmcp param', async () => {
            const observer = startAutoMCPFrameRenderer();

            const wrapper = document.createElement('div');
            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/?embedApp=true`;
            wrapper.appendChild(iframe);
            document.body.appendChild(wrapper);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).not.toHaveBeenCalled();
            observer.disconnect();
        });

        test('should ignore non-iframe element nodes', async () => {
            const observer = startAutoMCPFrameRenderer();

            const div = document.createElement('div');
            div.textContent = `${Param.Tsmcp}=true`;
            document.body.appendChild(div);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).not.toHaveBeenCalled();
            observer.disconnect();
        });

        test('should ignore text nodes', async () => {
            const observer = startAutoMCPFrameRenderer();

            const text = document.createTextNode('tsmcp=true');
            document.body.appendChild(text);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).not.toHaveBeenCalled();
            observer.disconnect();
        });

        test('should process multiple tsmcp iframes in one mutation', async () => {
            const observer = startAutoMCPFrameRenderer();

            const wrapper = document.createElement('div');
            const iframe1 = document.createElement('iframe');
            iframe1.src = `https://${thoughtSpotHost}/?${Param.Tsmcp}=true&id=1`;
            const iframe2 = document.createElement('iframe');
            iframe2.src = `https://${thoughtSpotHost}/?${Param.Tsmcp}=true&id=2`;
            wrapper.appendChild(iframe1);
            wrapper.appendChild(iframe2);
            document.body.appendChild(wrapper);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).toHaveBeenCalledTimes(2);
            observer.disconnect();
        });

        test('should ignore iframes with invalid src URLs', async () => {
            const observer = startAutoMCPFrameRenderer();

            const iframe = document.createElement('iframe');
            iframe.src = 'about:blank';
            document.body.appendChild(iframe);

            await new Promise((r) => setTimeout(r, 50));

            expect(renderIFrameSpy).not.toHaveBeenCalled();
            observer.disconnect();
        });
    });

    describe('handleInsertionIntoDOM override', () => {
        test('should replace the original iframe when renderIFrame inserts DOM', async () => {
            renderIFrameSpy.mockRestore();

            const replaceSpy = jest.fn();

            renderIFrameSpy = jest.spyOn(
                TsEmbed.prototype as any,
                'renderIFrame',
            ).mockImplementation(async function (this: any) {
                const newIframe = document.createElement('iframe');
                newIframe.src = 'https://replaced.example.com';
                this.frameToReplace.replaceWith = replaceSpy;
                this.handleInsertionIntoDOM(newIframe);
            });

            const observer = startAutoMCPFrameRenderer();

            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/?${Param.Tsmcp}=true`;
            document.body.appendChild(iframe);

            await new Promise((r) => setTimeout(r, 50));

            expect(replaceSpy).toHaveBeenCalled();
            observer.disconnect();
        });
    });

    describe('viewConfig forwarding', () => {
        test('should accept empty viewConfig', () => {
            const observer = startAutoMCPFrameRenderer({});
            expect(observer).toBeInstanceOf(MutationObserver);
            observer.disconnect();
        });

        test('should accept no arguments (default empty config)', () => {
            const observer = startAutoMCPFrameRenderer();
            expect(observer).toBeInstanceOf(MutationObserver);
            observer.disconnect();
        });
    });

    describe('getMCPIframeSrc URL construction', () => {
        test('should strip tsmcp param and merge embed params into rendered src', async () => {
            let capturedSrc = '';
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(
                TsEmbed.prototype as any,
                'renderIFrame',
            ).mockImplementation(async function (this: any, src: string) {
                capturedSrc = src;
            });

            const observer = startAutoMCPFrameRenderer();

            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/v2/?${Param.Tsmcp}=true&customParam=hello#/embed/viz`;
            document.body.appendChild(iframe);

            await new Promise((r) => setTimeout(r, 50));

            expect(capturedSrc).not.toContain(`${Param.Tsmcp}=true`);
            expect(capturedSrc).toContain('customParam=hello');
            observer.disconnect();
        });

        test('should preserve hash from original iframe src', async () => {
            let capturedSrc = '';
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(
                TsEmbed.prototype as any,
                'renderIFrame',
            ).mockImplementation(async function (this: any, src: string) {
                capturedSrc = src;
            });

            const observer = startAutoMCPFrameRenderer();

            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/v2/?${Param.Tsmcp}=true#/embed/viz/lb123`;
            document.body.appendChild(iframe);

            await new Promise((r) => setTimeout(r, 50));

            expect(capturedSrc).toContain('/embed/viz/lb123');
            observer.disconnect();
        });
    });
});
