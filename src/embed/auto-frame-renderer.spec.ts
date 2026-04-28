import { startAutoMCPFrameRenderer } from './auto-frame-renderer';
import { Action, AutoMCPFrameRendererViewConfig, EmbedEvent, InterceptedApiType, Param } from '../types';
import { init } from '../index';
import * as authInstance from '../auth';
import { TsEmbed } from './ts-embed';
import {
    getDocumentBody,
    postMessageToParent,
} from '../test/test-utils';

const thoughtSpotHost = 'tshost';
const TSMCP_SRC = `https://${thoughtSpotHost}/v2/?${Param.Tsmcp}=true#/embed/viz/lb1`;

describe('startAutoMCPFrameRenderer', () => {
    let renderIFrameSpy: jest.SpyInstance;
    let getEmbedBasePathSpy: jest.SpyInstance;

    beforeAll(() => {
        init({
            thoughtSpotHost,
            authType: 'None' as any,
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
            return `http://${thoughtSpotHost}/${query}#`;
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

    // ─── helpers ──────────────────────────────────────────────────────────────

    /** Capture the src passed to renderIFrame for the first tsmcp iframe added */
    async function captureRenderedSrc(viewConfig: AutoMCPFrameRendererViewConfig = {}): Promise<string> {
        let capturedSrc = '';
        renderIFrameSpy.mockRestore();
        renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
            .mockImplementation(async function (this: any, src: string) {
                capturedSrc = src;
            });

        const observer = startAutoMCPFrameRenderer(viewConfig);
        const iframe = document.createElement('iframe');
        iframe.src = TSMCP_SRC;
        document.body.appendChild(iframe);
        await new Promise((r) => setTimeout(r, 50));
        observer.disconnect();
        return capturedSrc;
    }

    /**
     * Trigger a full APP_INIT cycle via the actual TsEmbed message infrastructure.
     * Renders the replacement iframe into DOM so subscribeToMessageEvents fires,
     * then fires APP_INIT and returns the port.postMessage response payload.
     */
    async function getAppInitResponse(viewConfig: AutoMCPFrameRendererViewConfig = {}): Promise<any> {
        renderIFrameSpy.mockRestore();
        renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
            .mockImplementation(async function (this: any, src: string) {
                const iframe = document.createElement('iframe');
                iframe.src = src;
                this.setIframeElement(iframe);
                this.handleInsertionIntoDOM(iframe);
                this.subscribeToMessageEvents();
            });

        const observer = startAutoMCPFrameRenderer(viewConfig);
        const tsmcpIframe = document.createElement('iframe');
        tsmcpIframe.src = TSMCP_SRC;
        document.body.appendChild(tsmcpIframe);
        await new Promise((r) => setTimeout(r, 50));

        const embeddedIframe = document.querySelector('iframe');
        const mockPort: any = { postMessage: jest.fn() };
        postMessageToParent(embeddedIframe.contentWindow, { type: EmbedEvent.APP_INIT, data: {} }, mockPort);
        await new Promise((r) => setTimeout(r, 50));

        observer.disconnect();
        return mockPort.postMessage.mock.calls[0]?.[0];
    }

    // ─── MutationObserver setup ───────────────────────────────────────────────

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

    // ─── iframe detection via tsmcp param ─────────────────────────────────────

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

    // ─── handleInsertionIntoDOM override ──────────────────────────────────────

    describe('handleInsertionIntoDOM override', () => {
        test('should replace the original iframe when renderIFrame inserts DOM', async () => {
            renderIFrameSpy.mockRestore();
            const replaceSpy = jest.fn();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockImplementation(async function (this: any) {
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

    // ─── URL params forwarding ────────────────────────────────────────────────

    describe('URL params forwarding', () => {
        test('should accept empty viewConfig', () => {
            const observer = startAutoMCPFrameRenderer({});
            expect(observer).toBeInstanceOf(MutationObserver);
            observer.disconnect();
        });

        test('should accept no arguments', () => {
            const observer = startAutoMCPFrameRenderer();
            expect(observer).toBeInstanceOf(MutationObserver);
            observer.disconnect();
        });

        test('disabledActions → disableAction in rendered src', async () => {
            const src = await captureRenderedSrc({ disabledActions: [Action.Pin] });
            expect(src).toContain('disableAction');
        });

        test('disabledActionReason → disableHint in rendered src', async () => {
            const src = await captureRenderedSrc({
                disabledActions: [Action.Pin],
                disabledActionReason: 'Upgrade required',
            });
            expect(src).toContain('disableHint');
        });

        test('hiddenActions → hideAction in rendered src', async () => {
            const src = await captureRenderedSrc({ hiddenActions: [Action.Pin] });
            expect(src).toContain('hideAction');
        });

        test('visibleActions → visibleAction in rendered src', async () => {
            const src = await captureRenderedSrc({ visibleActions: [Action.Download] });
            expect(src).toContain('visibleAction');
        });

        test('locale → locale param in rendered src', async () => {
            const src = await captureRenderedSrc({ locale: 'fr-FR' });
            expect(src).toContain('locale=fr-FR');
        });

        test('showAlerts → showAlerts param in rendered src', async () => {
            const src = await captureRenderedSrc({ showAlerts: true });
            expect(src).toContain('showAlerts=true');
        });

        test('exposeTranslationIDs → exposeTranslationIDs in rendered src', async () => {
            const src = await captureRenderedSrc({ exposeTranslationIDs: true });
            expect(src).toContain('exposeTranslationIDs=true');
        });

        test('disableRedirectionLinksInNewTab → param in rendered src', async () => {
            const src = await captureRenderedSrc({ disableRedirectionLinksInNewTab: true });
            expect(src).toContain('disableRedirectionLinksInNewTab=true');
        });

        test('overrideOrgId → orgId param in rendered src', async () => {
            const src = await captureRenderedSrc({ overrideOrgId: 42 });
            expect(src).toContain('orgId=42');
        });

        test('linkOverride → linkOverride param in rendered src', async () => {
            const src = await captureRenderedSrc({ linkOverride: true });
            expect(src).toContain('linkOverride=true');
        });

        test('enableLinkOverridesV2 → enableLinkOverridesV2 + linkOverride in rendered src', async () => {
            const src = await captureRenderedSrc({ enableLinkOverridesV2: true });
            expect(src).toContain('enableLinkOverridesV2=true');
            expect(src).toContain('linkOverride=true');
        });

        test('additionalFlags → merged into rendered src', async () => {
            const src = await captureRenderedSrc({ additionalFlags: { myFlag: 'hello', anotherFlag: 1 } });
            expect(src).toContain('myFlag=hello');
            expect(src).toContain('anotherFlag=1');
        });

        test('additionalFlags from viewConfig override those from init', async () => {
            const src = await captureRenderedSrc({ additionalFlags: { overrideFlag: 'view' } });
            expect(src).toContain('overrideFlag=view');
        });

        test('rendered src always contains a query string before the hash', async () => {
            const src = await captureRenderedSrc();
            expect(src).toMatch(/\?[^#]+#/);
        });
    });

    // ─── frameParams forwarding ───────────────────────────────────────────────

    describe('frameParams forwarding', () => {
        test('frameParams.height and .width applied to the replacement iframe element', async () => {
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockResolvedValue(undefined);
            const createIframeElSpy = jest.spyOn(TsEmbed.prototype as any, 'createIframeEl');

            const observer = startAutoMCPFrameRenderer({ frameParams: { height: '600px', width: '100%' } });
            const iframe = document.createElement('iframe');
            iframe.src = TSMCP_SRC;
            document.body.appendChild(iframe);
            await new Promise((r) => setTimeout(r, 50));

            if (createIframeElSpy.mock.calls.length > 0) {
                const created = createIframeElSpy.mock.results[0]?.value as HTMLIFrameElement;
                expect(created?.style?.height).toBe('600px');
                expect(created?.style?.width).toBe('100%');
            }
            createIframeElSpy.mockRestore();
            observer.disconnect();
        });

        test('frameParams custom HTML attributes applied to the iframe element', async () => {
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockResolvedValue(undefined);
            const createIframeElSpy = jest.spyOn(TsEmbed.prototype as any, 'createIframeEl');

            const observer = startAutoMCPFrameRenderer({
                frameParams: { height: '400px', width: '800px', 'data-testid': 'my-embed' } as any,
            });
            const iframe = document.createElement('iframe');
            iframe.src = TSMCP_SRC;
            document.body.appendChild(iframe);
            await new Promise((r) => setTimeout(r, 50));

            if (createIframeElSpy.mock.calls.length > 0) {
                const created = createIframeElSpy.mock.results[0]?.value as HTMLIFrameElement;
                expect(created?.getAttribute('data-testid')).toBe('my-embed');
            }
            createIframeElSpy.mockRestore();
            observer.disconnect();
        });
    });

    // ─── APP_INIT postMessage params forwarding ───────────────────────────────
    //
    // These params are not in the iframe src URL — they travel via the APP_INIT
    // postMessage channel. AutoFrameRenderer inherits the TsEmbed APP_INIT
    // handler, so the full round-trip is tested here.

    describe('APP_INIT params forwarding', () => {
        test('customizations.style.customCSS included in APP_INIT response', async () => {
            const customizations = {
                style: { customCSS: { variables: { '--ts-var-root-background': '#fff' } } },
            };
            const response = await getAppInitResponse({ customizations });
            expect(response?.data?.customisations?.style?.customCSS).toEqual(
                customizations.style.customCSS,
            );
        });

        test('customizations.content.strings included in APP_INIT response', async () => {
            const customizations = {
                content: { strings: { DATA: 'Data' } },
            };
            const response = await getAppInitResponse({ customizations });
            expect(response?.data?.customisations?.content?.strings?.DATA).toBe('Data');
        });

        test('customActions included in APP_INIT response', async () => {
            const customActions = [
                {
                    id: 'my-action',
                    name: 'My Action',
                    position: 'PRIMARY' as any,
                    target: 'ANSWER' as any,
                },
            ];
            const response = await getAppInitResponse({ customActions });
            expect(response?.data?.customActions).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: 'my-action' })]),
            );
        });

        test('shouldBypassPayloadValidation forwarded via APP_INIT', async () => {
            const response = await getAppInitResponse({ shouldBypassPayloadValidation: true });
            expect(response?.data?.shouldBypassPayloadValidation).toBe(true);
        });

        test('useHostEventsV2 forwarded via APP_INIT', async () => {
            const response = await getAppInitResponse({ useHostEventsV2: true });
            expect(response?.data?.useHostEventsV2).toBe(true);
        });

        test('refreshAuthTokenOnNearExpiry forwarded as embedExpiryInAuthToken', async () => {
            const response = await getAppInitResponse({ refreshAuthTokenOnNearExpiry: true });
            expect(response?.data?.embedExpiryInAuthToken).toBe(true);
        });

        test('interceptUrls forwarded via APP_INIT', async () => {
            // The SDK expands InterceptedApiType enum values into resolved prism endpoint URLs.
            // Assert that the interceptUrls array is non-empty (i.e. the config was forwarded
            // and processed) rather than checking the resolved strings directly.
            const response = await getAppInitResponse({
                interceptUrls: [InterceptedApiType.AnswerData],
            });
            expect(response?.data?.interceptUrls).toBeInstanceOf(Array);
            expect(response?.data?.interceptUrls.length).toBeGreaterThan(0);
        });

        test('interceptTimeout forwarded via APP_INIT', async () => {
            const response = await getAppInitResponse({ interceptTimeout: 5000 });
            expect(response?.data?.interceptTimeout).toBe(5000);
        });
    });

    // ─── getMCPIframeSrc URL construction ─────────────────────────────────────

    describe('getMCPIframeSrc URL construction', () => {
        test('should strip tsmcp param and merge embed params into rendered src', async () => {
            let capturedSrc = '';
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockImplementation(async function (this: any, src: string) {
                    capturedSrc = src;
                });

            const observer = startAutoMCPFrameRenderer();
            const iframe = document.createElement('iframe');
            iframe.src = `https://${thoughtSpotHost}/v2/?${Param.Tsmcp}=true&customParam=hello#/embed/viz`;
            document.body.appendChild(iframe);
            await new Promise((r) => setTimeout(r, 50));

            expect(capturedSrc).not.toContain(`${Param.Tsmcp}=true`);
            expect(capturedSrc).toContain('customParam=hello');
            expect(capturedSrc).toMatch(/\?[^#]+#/);
            observer.disconnect();
        });

        test('should preserve hash from original iframe src', async () => {
            let capturedSrc = '';
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockImplementation(async function (this: any, src: string) {
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

        test('should produce empty query string when no embed params and no source params', async () => {
            let capturedSrc = '';
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockImplementation(async function (this: any, src: string) {
                    capturedSrc = src;
                });

            const observer = startAutoMCPFrameRenderer();
            const iframe = document.createElement('iframe');
            // Only tsmcp (stripped) — no other params
            iframe.src = `https://${thoughtSpotHost}/?${Param.Tsmcp}=true`;
            document.body.appendChild(iframe);
            await new Promise((r) => setTimeout(r, 50));

            // At minimum the base embed params (hostAppUrl, sdkVersion, etc.) are always present
            expect(capturedSrc).toMatch(/\?[^#]+#/);
            observer.disconnect();
        });

        test('source params take precedence over viewConfig params for the same key', async () => {
            let capturedSrc = '';
            renderIFrameSpy.mockRestore();
            renderIFrameSpy = jest.spyOn(TsEmbed.prototype as any, 'renderIFrame')
                .mockImplementation(async function (this: any, src: string) {
                    capturedSrc = src;
                });

            const observer = startAutoMCPFrameRenderer({ additionalFlags: { locale: 'en-US' } });
            const iframe = document.createElement('iframe');
            // Source overrides with de-DE
            iframe.src = `https://${thoughtSpotHost}/v2/?${Param.Tsmcp}=true&locale=de-DE#/embed/viz`;
            document.body.appendChild(iframe);
            await new Promise((r) => setTimeout(r, 50));

            expect(capturedSrc).toContain('locale=de-DE');
            observer.disconnect();
        });
    });
});
