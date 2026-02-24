import { AutoMCPFrameRendererViewConfig, Param } from "../types";
import { TsEmbed } from "./ts-embed";
import { getQueryParamString } from "../utils";


export function startAutoMCPFrameRenderer(viewConfig: AutoMCPFrameRendererViewConfig = {}) {

    const replaceWithMCPIframe = (iframe: HTMLIFrameElement) => {
        const autoMCPFrameRenderer = new AutoFrameRenderer(viewConfig);
        autoMCPFrameRenderer.replaceIframe(iframe);
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                if (node instanceof HTMLIFrameElement && isTSMCPIframe(node)) {
                    replaceWithMCPIframe(node);
                }
                if (node instanceof HTMLElement) {
                    node.querySelectorAll('iframe').forEach((iframe) => {
                        if (isTSMCPIframe(iframe)) {
                            replaceWithMCPIframe(iframe);
                        }
                    });
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return observer;
}

function isTSMCPIframe(iframe: HTMLIFrameElement) {
    const src = iframe.src;
    return src.includes(`${Param.Tsmcp}=true`);
}

class AutoFrameRenderer extends TsEmbed {
    private frameToReplace: HTMLIFrameElement;

    constructor(protected viewConfig: AutoMCPFrameRendererViewConfig) {
        viewConfig.embedComponentType = 'auto-frame-renderer';
        const container = document.createElement('div');
        super(container, viewConfig);
    }

    private getMCPIframeSrc(sourceSrc: string) {
        const queryParams = this.getEmbedParamsObject();
        const sourceURL = new URL(sourceSrc);
        const existingQueryParams = sourceURL.searchParams;
        // convert existing query params to an object
        const existingQueryParamsObject = Object.fromEntries(existingQueryParams);
        delete existingQueryParamsObject[Param.Tsmcp];

        // merge the existing query params with the new query params
        const mergedQueryParams = { ...queryParams, ...existingQueryParamsObject };
        const mergedQueryParamsString = getQueryParamString(mergedQueryParams);
        const frameSrc = `${sourceURL.origin}${sourceURL.pathname}?${mergedQueryParamsString}/${sourceURL.hash}`;
        return frameSrc;
    }

    protected handleInsertionIntoDOM(child: string | Node): void {
        if (this.frameToReplace) {
            this.frameToReplace.replaceWith(child);
        } else {
            super.handleInsertionIntoDOM(child);
        }
    }

    public async replaceIframe(iframe: HTMLIFrameElement): Promise<void> {
        this.frameToReplace = iframe;
        const src = this.getMCPIframeSrc(iframe.src);
        await this.renderIFrame(src);
    }
}

