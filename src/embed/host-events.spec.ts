/**
 * Unit tests for HostEvents that had no prior coverage.
 * Covers: postMessage type correctness, !isRendered guard (returns null + handleError),
 * and vizId injection on LiveboardEmbed when viewConfig.vizId is set.
 */
import {
    init,
    AuthType,
    LiveboardEmbed,
    AppEmbed,
    HostEvent,
    EmbedErrorCodes,
} from '../index';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameEl,
    getRootEl,
    mockMessageChannel,
    messageChannelMock,
} from '../test/test-utils';
import * as authInstance from '../auth';

const thoughtSpotHost = 'https://tshost';
const liveboardId = 'eca215d4-0d2c-4a55-90e3-d81ef6848ae0';
const vizId = '6e73f724-660e-11eb-ae93-0242ac130002';

beforeAll(() => {
    init({ thoughtSpotHost, authType: AuthType.None });
    jest.spyOn(authInstance, 'postLoginService').mockImplementation(() => Promise.resolve(true as any));
});

beforeEach(() => {
    document.body.innerHTML = getDocumentBody();
});

// ---------------------------------------------------------------------------
// Helper: render a LiveboardEmbed and return it with the iframe spy
// ---------------------------------------------------------------------------
async function renderLiveboard(extraConfig: Record<string, any> = {}) {
    const lb = new LiveboardEmbed(getRootEl(), {
        frameParams: { width: '100%', height: '100%' },
        liveboardId,
        ...extraConfig,
    });
    await lb.render();
    const iframe = getIFrameEl();
    jest.spyOn(iframe.contentWindow, 'postMessage');
    return { lb, iframe };
}

// Helper: create a LiveboardEmbed that has NOT been rendered, with handleError
// mocked to prevent the jest-setup console.error → throw.
function unrenderedLiveboard() {
    const lb = new LiveboardEmbed(getRootEl(), {
        frameParams: { width: '100%', height: '100%' },
        liveboardId,
    });
    jest.spyOn(lb as any, 'handleError').mockImplementation(() => {});
    return lb;
}

// ---------------------------------------------------------------------------
// 3 – Filter
// ---------------------------------------------------------------------------
describe('HostEvent.Filter', () => {
    test('postMessage type is filter (all lowercase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Filter, { columnName: 'col', operator: 'EQ', values: ['v'] } as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'filter' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null and calls handleError when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const handleErrorSpy = (lb as any).handleError as jest.Mock;
        const result = await lb.trigger(HostEvent.Filter, {} as any);
        expect(result).toBeNull();
        expect(handleErrorSpy).toHaveBeenCalledWith(
            expect.objectContaining({ code: EmbedErrorCodes.RENDER_NOT_CALLED }),
        );
    });
});

// ---------------------------------------------------------------------------
// 8 – UpdateRuntimeFilters
// ---------------------------------------------------------------------------
describe('HostEvent.UpdateRuntimeFilters', () => {
    test('postMessage type is UpdateRuntimeFilters (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.UpdateRuntimeFilters, [] as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'UpdateRuntimeFilters' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.UpdateRuntimeFilters, [] as any);
        expect(result).toBeNull();
    });

    test('vizId is injected when viewConfig.vizId is set and payload is object', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard({ vizId });
        await executeAfterWait(() => {
            lb.trigger(HostEvent.UpdateRuntimeFilters, [{}] as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'UpdateRuntimeFilters' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });
});

// ---------------------------------------------------------------------------
// 10 – OpenFilter
// ---------------------------------------------------------------------------
describe('HostEvent.OpenFilter', () => {
    test('postMessage type is openFilter (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.OpenFilter, { columnId: 'col1' } as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'openFilter' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.OpenFilter, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 11 – AddColumns
// ---------------------------------------------------------------------------
describe('HostEvent.AddColumns', () => {
    test('postMessage type is addColumns (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.AddColumns, { columnIds: ['c1'] } as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'addColumns' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.AddColumns, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 12 – RemoveColumn
// ---------------------------------------------------------------------------
describe('HostEvent.RemoveColumn', () => {
    test('postMessage type is removeColumn (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.RemoveColumn, { columnId: 'c1' } as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'removeColumn' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.RemoveColumn, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 15 – LiveboardInfo
// ---------------------------------------------------------------------------
describe('HostEvent.LiveboardInfo', () => {
    test('postMessage type is pinboardInfo', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.LiveboardInfo);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'pinboardInfo' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.LiveboardInfo);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 16 – Schedule
// ---------------------------------------------------------------------------
describe('HostEvent.Schedule', () => {
    test('postMessage type is subscription', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Schedule);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'subscription' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Schedule);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 17 – SchedulesList
// ---------------------------------------------------------------------------
describe('HostEvent.SchedulesList', () => {
    test('postMessage type is schedule-list (hyphenated)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SchedulesList);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'schedule-list' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SchedulesList);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 18 – ExportTML
// ---------------------------------------------------------------------------
describe('HostEvent.ExportTML', () => {
    test('postMessage type is exportTSL (uses TSL abbreviation)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ExportTML);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'exportTSL' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.ExportTML);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 19 – EditTML
// ---------------------------------------------------------------------------
describe('HostEvent.EditTML', () => {
    test('postMessage type is editTSL', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.EditTML);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'editTSL' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.EditTML);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 20 – UpdateTML
// ---------------------------------------------------------------------------
describe('HostEvent.UpdateTML', () => {
    test('postMessage type is updateTSL', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.UpdateTML);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'updateTSL' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.UpdateTML);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 21 – DownloadAsPdf
// ---------------------------------------------------------------------------
describe('HostEvent.DownloadAsPdf', () => {
    test('postMessage type is downloadAsPdf (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadAsPdf);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'downloadAsPdf' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DownloadAsPdf);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 22 – DownloadLiveboardAsContinuousPDF
// ---------------------------------------------------------------------------
describe('HostEvent.DownloadLiveboardAsContinuousPDF', () => {
    test('postMessage type is downloadLiveboardAsContinuousPDF', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadLiveboardAsContinuousPDF);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'downloadLiveboardAsContinuousPDF' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DownloadLiveboardAsContinuousPDF);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 23 – AIHighlights
// ---------------------------------------------------------------------------
describe('HostEvent.AIHighlights', () => {
    test('postMessage type is AIHighlights (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.AIHighlights);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'AIHighlights' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.AIHighlights);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 24 – MakeACopy
// ---------------------------------------------------------------------------
describe('HostEvent.MakeACopy', () => {
    test('postMessage type is makeACopy (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.MakeACopy);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'makeACopy' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.MakeACopy);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 25 – Remove (maps to 'delete' string)
// ---------------------------------------------------------------------------
describe('HostEvent.Remove', () => {
    test("postMessage type is 'delete' (NOT 'Remove')", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Remove);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'delete' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Remove);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 26 – Explore
// ---------------------------------------------------------------------------
describe('HostEvent.Explore', () => {
    test('postMessage type is explore (all lowercase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Explore, { vizId: 'v1' } as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'explore' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Explore, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 27 – CreateMonitor
// ---------------------------------------------------------------------------
describe('HostEvent.CreateMonitor', () => {
    test('postMessage type is createMonitor (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.CreateMonitor);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'createMonitor' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.CreateMonitor);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 28 – ManageMonitor
// ---------------------------------------------------------------------------
describe('HostEvent.ManageMonitor', () => {
    test('postMessage type is manageMonitor (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ManageMonitor);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'manageMonitor' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.ManageMonitor);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 29 – Edit
// ---------------------------------------------------------------------------
describe('HostEvent.Edit', () => {
    test('postMessage type is edit (all lowercase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Edit);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'edit' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Edit);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 30 – CopyLink (maps to 'embedDocument')
// ---------------------------------------------------------------------------
describe('HostEvent.CopyLink', () => {
    test("postMessage type is 'embedDocument' (NOT 'CopyLink')", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.CopyLink);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'embedDocument' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.CopyLink);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 33 – ShowUnderlyingData
// ---------------------------------------------------------------------------
describe('HostEvent.ShowUnderlyingData', () => {
    test('postMessage type is showUnderlyingData (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ShowUnderlyingData);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'showUnderlyingData' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.ShowUnderlyingData);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 34 – Delete (maps to 'onDeleteAnswer')
// ---------------------------------------------------------------------------
describe('HostEvent.Delete', () => {
    test("postMessage type is 'onDeleteAnswer' (NOT 'delete' or 'Delete')", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Delete);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'onDeleteAnswer' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Delete);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 35 – SpotIQAnalyze
// ---------------------------------------------------------------------------
describe('HostEvent.SpotIQAnalyze', () => {
    test('postMessage type is spotIQAnalyze (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SpotIQAnalyze);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'spotIQAnalyze' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SpotIQAnalyze);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 36 – Download (maps to 'downloadAsPng', same as DownloadAsPng)
// ---------------------------------------------------------------------------
describe('HostEvent.Download', () => {
    test("postMessage type is 'downloadAsPng' (same string as DownloadAsPng)", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Download);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'downloadAsPng' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('Download and DownloadAsPng share the identical string value', () => {
        expect(HostEvent.Download).toBe(HostEvent.DownloadAsPng);
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Download);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 37 – DownloadAsPng
// ---------------------------------------------------------------------------
describe('HostEvent.DownloadAsPng', () => {
    test('postMessage type is downloadAsPng', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadAsPng);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'downloadAsPng' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DownloadAsPng);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 39 – DownloadAsXlsx
// ---------------------------------------------------------------------------
describe('HostEvent.DownloadAsXlsx', () => {
    test('postMessage type is downloadAsXLSX (capital X-L-S-X)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadAsXlsx);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'downloadAsXLSX' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DownloadAsXlsx);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 40 – Share
// ---------------------------------------------------------------------------
describe('HostEvent.Share', () => {
    test('postMessage type is share (all lowercase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Share);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'share' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.Share);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 42 – SyncToSheets
// ---------------------------------------------------------------------------
describe('HostEvent.SyncToSheets', () => {
    test('postMessage type is sync-to-sheets (hyphenated, all lowercase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SyncToSheets);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'sync-to-sheets' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SyncToSheets);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 43 – SyncToOtherApps
// ---------------------------------------------------------------------------
describe('HostEvent.SyncToOtherApps', () => {
    test('postMessage type is sync-to-other-apps (hyphenated)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SyncToOtherApps);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'sync-to-other-apps' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SyncToOtherApps);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 44 – ManagePipelines
// ---------------------------------------------------------------------------
describe('HostEvent.ManagePipelines', () => {
    test("postMessage type is 'manage-pipeline' (singular, hyphenated)", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ManagePipelines);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'manage-pipeline' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.ManagePipelines);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 45 – ResetSearch
// ---------------------------------------------------------------------------
describe('HostEvent.ResetSearch', () => {
    test('postMessage type is resetSearch (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ResetSearch);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'resetSearch' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.ResetSearch);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 49 – SetVisibleTabs
// ---------------------------------------------------------------------------
describe('HostEvent.SetVisibleTabs', () => {
    test("postMessage type is 'SetPinboardVisibleTabs' (NOT 'SetVisibleTabs')", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SetVisibleTabs, ['tab1'] as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'SetPinboardVisibleTabs' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SetVisibleTabs, [] as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 50 – SetHiddenTabs
// ---------------------------------------------------------------------------
describe('HostEvent.SetHiddenTabs', () => {
    test("postMessage type is 'SetPinboardHiddenTabs' (NOT 'SetHiddenTabs')", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SetHiddenTabs, ['tab1'] as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'SetPinboardHiddenTabs' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SetHiddenTabs, [] as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 52 – AskSage
// ---------------------------------------------------------------------------
describe('HostEvent.AskSage', () => {
    test('postMessage type is AskSage (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.AskSage);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'AskSage' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.AskSage);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 53 – UpdateCrossFilter
// ---------------------------------------------------------------------------
describe('HostEvent.UpdateCrossFilter', () => {
    test('postMessage type is UpdateCrossFilter (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.UpdateCrossFilter, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'UpdateCrossFilter' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.UpdateCrossFilter, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 56 – UpdateParameters
// ---------------------------------------------------------------------------
describe('HostEvent.UpdateParameters', () => {
    test('postMessage type is UpdateParameters (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.UpdateParameters, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'UpdateParameters' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.UpdateParameters, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 60 – SelectPersonalizedView (maps to British spelling)
// ---------------------------------------------------------------------------
describe('HostEvent.SelectPersonalizedView', () => {
    test("postMessage type is 'SelectPersonalisedView' (British spelling)", async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SelectPersonalizedView, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'SelectPersonalisedView' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SelectPersonalizedView, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 64 – TransformTableVizData
// ---------------------------------------------------------------------------
describe('HostEvent.TransformTableVizData', () => {
    test('postMessage type is TransformTableVizData (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.TransformTableVizData, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'TransformTableVizData' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.TransformTableVizData, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 65 – SpotterSearch
// ---------------------------------------------------------------------------
describe('HostEvent.SpotterSearch', () => {
    test('postMessage type is SpotterSearch (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SpotterSearch, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'SpotterSearch' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SpotterSearch, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 66 – EditLastPrompt
// ---------------------------------------------------------------------------
describe('HostEvent.EditLastPrompt', () => {
    test('postMessage type is EditLastPrompt (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.EditLastPrompt, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'EditLastPrompt' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.EditLastPrompt, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 67 – PreviewSpotterData
// ---------------------------------------------------------------------------
describe('HostEvent.PreviewSpotterData', () => {
    test('postMessage type is PreviewSpotterData (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.PreviewSpotterData, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'PreviewSpotterData' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.PreviewSpotterData, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 68 – AddToCoaching
// ---------------------------------------------------------------------------
describe('HostEvent.AddToCoaching', () => {
    test('postMessage type is addToCoaching (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.AddToCoaching, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'addToCoaching' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.AddToCoaching, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 69 – DataModelInstructions
// ---------------------------------------------------------------------------
describe('HostEvent.DataModelInstructions', () => {
    test('postMessage type is DataModelInstructions (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DataModelInstructions, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'DataModelInstructions' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DataModelInstructions, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 70 – ResetSpotterConversation
// ---------------------------------------------------------------------------
describe('HostEvent.ResetSpotterConversation', () => {
    test('postMessage type is ResetSpotterConversation (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ResetSpotterConversation, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'ResetSpotterConversation' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.ResetSpotterConversation, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 71 – DeleteLastPrompt
// ---------------------------------------------------------------------------
describe('HostEvent.DeleteLastPrompt', () => {
    test('postMessage type is DeleteLastPrompt (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DeleteLastPrompt, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'DeleteLastPrompt' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DeleteLastPrompt, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 72 – AnswerChartSwitcher
// ---------------------------------------------------------------------------
describe('HostEvent.AnswerChartSwitcher', () => {
    test('postMessage type is answerChartSwitcher (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.AnswerChartSwitcher, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'answerChartSwitcher' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.AnswerChartSwitcher, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 75 – AskSpotter
// ---------------------------------------------------------------------------
describe('HostEvent.AskSpotter', () => {
    test('postMessage type is AskSpotter (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.AskSpotter, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'AskSpotter' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.AskSpotter, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 78 – StartNewSpotterConversation
// ---------------------------------------------------------------------------
describe('HostEvent.StartNewSpotterConversation', () => {
    test('postMessage type is StartNewSpotterConversation (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.StartNewSpotterConversation, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'StartNewSpotterConversation' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.StartNewSpotterConversation, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 80 – SendTestScheduleEmail
// ---------------------------------------------------------------------------
describe('HostEvent.SendTestScheduleEmail', () => {
    test('postMessage type is sendTestScheduleEmail (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SendTestScheduleEmail, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'sendTestScheduleEmail' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SendTestScheduleEmail, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 81 – SpotterVizSendUserMessage
// ---------------------------------------------------------------------------
describe('HostEvent.SpotterVizSendUserMessage', () => {
    test('postMessage type is SpotterVizSendUserMessage (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SpotterVizSendUserMessage, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'SpotterVizSendUserMessage' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SpotterVizSendUserMessage, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 82 – InitSpotterVizConversation
// ---------------------------------------------------------------------------
describe('HostEvent.InitSpotterVizConversation', () => {
    test('postMessage type is InitSpotterVizConversation (PascalCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.InitSpotterVizConversation, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'InitSpotterVizConversation' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.InitSpotterVizConversation, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 83 – RefreshLiveboardBrowserCache
// ---------------------------------------------------------------------------
describe('HostEvent.RefreshLiveboardBrowserCache', () => {
    test('postMessage type is refreshLiveboardBrowserCache (camelCase)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.RefreshLiveboardBrowserCache, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'refreshLiveboardBrowserCache' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('returns null when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.RefreshLiveboardBrowserCache, {} as any);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// vizId injection tests — verifies LiveboardEmbed injects viewConfig.vizId
// ---------------------------------------------------------------------------
describe('vizId injection on LiveboardEmbed trigger (object payload)', () => {
    const eventsWithVizId: Array<[string, HostEvent, any]> = [
        ['Filter', HostEvent.Filter, { columnName: 'c' }],
        ['OpenFilter', HostEvent.OpenFilter, { columnId: 'c1' }],
        ['AddColumns', HostEvent.AddColumns, { columnIds: ['c1'] }],
        ['RemoveColumn', HostEvent.RemoveColumn, { columnId: 'c1' }],
        ['LiveboardInfo', HostEvent.LiveboardInfo, {}],
        ['Schedule', HostEvent.Schedule, {}],
        ['SchedulesList', HostEvent.SchedulesList, {}],
        ['ExportTML', HostEvent.ExportTML, {}],
        ['EditTML', HostEvent.EditTML, {}],
        ['UpdateTML', HostEvent.UpdateTML, {}],
        ['DownloadAsPdf', HostEvent.DownloadAsPdf, {}],
        ['DownloadLiveboardAsContinuousPDF', HostEvent.DownloadLiveboardAsContinuousPDF, {}],
        ['AIHighlights', HostEvent.AIHighlights, {}],
        ['MakeACopy', HostEvent.MakeACopy, {}],
        ['Remove', HostEvent.Remove, {}],
        ['Explore', HostEvent.Explore, {}],
        ['CreateMonitor', HostEvent.CreateMonitor, {}],
        ['ManageMonitor', HostEvent.ManageMonitor, {}],
        ['Edit', HostEvent.Edit, {}],
        ['CopyLink', HostEvent.CopyLink, {}],
        ['ShowUnderlyingData', HostEvent.ShowUnderlyingData, {}],
        ['Delete', HostEvent.Delete, {}],
        ['SpotIQAnalyze', HostEvent.SpotIQAnalyze, {}],
        ['Download', HostEvent.Download, {}],
        ['DownloadAsPng', HostEvent.DownloadAsPng, {}],
        ['DownloadAsXlsx', HostEvent.DownloadAsXlsx, {}],
        ['Share', HostEvent.Share, {}],
        ['SyncToSheets', HostEvent.SyncToSheets, {}],
        ['SyncToOtherApps', HostEvent.SyncToOtherApps, {}],
        ['ManagePipelines', HostEvent.ManagePipelines, {}],
        ['SelectPersonalizedView', HostEvent.SelectPersonalizedView, {}],
        ['UpdateCrossFilter', HostEvent.UpdateCrossFilter, {}],
        ['UpdateParameters', HostEvent.UpdateParameters, {}],
        ['TransformTableVizData', HostEvent.TransformTableVizData, {}],
        ['PreviewSpotterData', HostEvent.PreviewSpotterData, {}],
        ['AnswerChartSwitcher', HostEvent.AnswerChartSwitcher, {}],
    ];

    test.each(eventsWithVizId)(
        '%s: viewConfig.vizId is injected into the payload as data.vizId',
        async (name, event, payload) => {
            mockMessageChannel();
            const { lb, iframe } = await renderLiveboard({ vizId });
            await executeAfterWait(() => {
                lb.trigger(event, payload as any);
                expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({ vizId }),
                    }),
                    thoughtSpotHost,
                    expect.anything(),
                );
            });
        },
    );
});

// ---------------------------------------------------------------------------
// Array payload vizId injection — vizId added as a non-indexed property on the
// array object (array.length remains unchanged)
// ---------------------------------------------------------------------------
describe('vizId injection on LiveboardEmbed trigger (array payload)', () => {
    const arrayEvents: Array<[string, HostEvent]> = [
        ['UpdateRuntimeFilters', HostEvent.UpdateRuntimeFilters],
        ['SetVisibleTabs', HostEvent.SetVisibleTabs],
        ['SetHiddenTabs', HostEvent.SetHiddenTabs],
    ];

    test.each(arrayEvents)(
        '%s: vizId is added as a non-indexed property on the array — array.length unchanged',
        async (name, event) => {
            mockMessageChannel();
            const { lb, iframe } = await renderLiveboard({ vizId });
            const arrayPayload = ['item1', 'item2'];
            await executeAfterWait(() => {
                lb.trigger(event, arrayPayload as any);
                const call = (iframe.contentWindow.postMessage as jest.Mock).mock.calls[0];
                const sentData = call[0].data;
                // vizId is set as a property directly on the array object
                expect((sentData as any).vizId).toBe(vizId);
                // array.length is unchanged
                expect(sentData.length).toBe(2);
            });
        },
    );

    test.each(arrayEvents)(
        '%s: without viewConfig.vizId — array payload is sent as-is (no vizId property)',
        async (name, event) => {
            mockMessageChannel();
            const { lb, iframe } = await renderLiveboard(); // no vizId
            const arrayPayload = ['item1'];
            await executeAfterWait(() => {
                lb.trigger(event, arrayPayload as any);
                const call = (iframe.contentWindow.postMessage as jest.Mock).mock.calls[0];
                const sentData = call[0].data;
                expect((sentData as any).vizId).toBeUndefined();
            });
        },
    );
});

// ---------------------------------------------------------------------------
// UpdateRuntimeFilters — without vizId, array payload sent as-is
// ---------------------------------------------------------------------------
describe('HostEvent.UpdateRuntimeFilters — additional cases', () => {
    test('without viewConfig.vizId — RuntimeFilter array payload sent as-is', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard(); // no vizId
        const filters = [{ columnName: 'col', operator: 'EQ', values: ['v1'] }];
        await executeAfterWait(() => {
            lb.trigger(HostEvent.UpdateRuntimeFilters, filters as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'UpdateRuntimeFilters' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });
});

// ---------------------------------------------------------------------------
// iframe MessageChannel response resolves the trigger promise
// ---------------------------------------------------------------------------
describe('trigger promise resolves with iframe response', () => {
    const responseEvents: Array<[string, HostEvent, any]> = [
        ['AddColumns', HostEvent.AddColumns, { columnIds: ['c1'] }],
        ['RemoveColumn', HostEvent.RemoveColumn, { columnId: 'c1' }],
        ['UpdateTML', HostEvent.UpdateTML, {}],
        ['AIHighlights', HostEvent.AIHighlights, {}],
        ['AskSage', HostEvent.AskSage, {}],
        ['AskSpotter', HostEvent.AskSpotter, {}],
        ['TransformTableVizData', HostEvent.TransformTableVizData, {}],
        ['SpotterSearch', HostEvent.SpotterSearch, {}],
    ];

    test.each(responseEvents)(
        '%s: trigger promise resolves with the full responseData from iframe',
        async (name, event, payload) => {
            mockMessageChannel();
            const { lb } = await renderLiveboard();
            const responseData = { test: 'data-from-iframe' };

            // Start the trigger (which internally posts to the MessageChannel)
            const triggerPromise = lb.trigger(event, payload as any);

            // Simulate the iframe responding via port1
            messageChannelMock.port1.onmessage({ data: responseData });

            const result = await triggerPromise;
            expect(result).toEqual(responseData);
        },
    );
});

// ---------------------------------------------------------------------------
// Context parameter forwarding
// ---------------------------------------------------------------------------
describe('context parameter forwarded in postMessage payload', () => {
    test('ExportTML: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ExportTML, {} as any, 'Liveboard' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Liveboard' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('EditTML: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.EditTML, {} as any, 'Search' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Search' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('DownloadAsPdf: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadAsPdf, {} as any, 'Liveboard' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Liveboard' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('MakeACopy: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.MakeACopy, {} as any, 'Answer' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Answer' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('CreateMonitor: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.CreateMonitor, {} as any, 'Liveboard' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Liveboard' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('ShowUnderlyingData: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.ShowUnderlyingData, {} as any, 'Liveboard' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Liveboard' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('SpotIQAnalyze: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SpotIQAnalyze, {} as any, 'Answer' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Answer' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('Edit: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Edit, {} as any, 'Liveboard' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Liveboard' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });

    test('CopyLink: context is forwarded as context field in postMessage', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard();
        await executeAfterWait(() => {
            lb.trigger(HostEvent.CopyLink, {} as any, 'Liveboard' as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'Liveboard' }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });
});

// ---------------------------------------------------------------------------
// SetVisibleVizs — array vizId injection (NOT in the parametrized arrayEvents)
// ---------------------------------------------------------------------------
describe('HostEvent.SetVisibleVizs — array payload vizId injection', () => {
    test('vizId is added as a non-indexed property on the array — array.length unchanged', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard({ vizId });
        const arrayPayload = ['viz1', 'viz2'];
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SetVisibleVizs, arrayPayload as any);
            const call = (iframe.contentWindow.postMessage as jest.Mock).mock.calls[0];
            const sentData = call[0].data;
            expect((sentData as any).vizId).toBe(vizId);
            expect(sentData.length).toBe(2);
        });
    });

    test('without viewConfig.vizId — array payload is sent as-is (no vizId property)', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard(); // no vizId
        const arrayPayload = ['viz1'];
        await executeAfterWait(() => {
            lb.trigger(HostEvent.SetVisibleVizs, arrayPayload as any);
            const call = (iframe.contentWindow.postMessage as jest.Mock).mock.calls[0];
            const sentData = call[0].data;
            expect((sentData as any).vizId).toBeUndefined();
        });
    });

    test('returns null and calls handleError when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.SetVisibleVizs, ['viz1'] as any);
        expect(result).toBeNull();
        expect((lb as any).handleError).toHaveBeenCalledWith(
            expect.objectContaining({ code: EmbedErrorCodes.RENDER_NOT_CALLED }),
        );
    });
});

// ---------------------------------------------------------------------------
// UpdateRuntimeFilters — AppEmbed path (no vizId injection)
// ---------------------------------------------------------------------------
describe('HostEvent.UpdateRuntimeFilters — AppEmbed path', () => {
    async function renderApp() {
        const app = new AppEmbed(getRootEl(), {
            frameParams: { width: '100%', height: '100%' },
        });
        await app.render();
        const iframe = getIFrameEl();
        jest.spyOn(iframe.contentWindow, 'postMessage');
        return { app, iframe };
    }

    test('AppEmbed sends payload directly without vizId injection', async () => {
        mockMessageChannel();
        const { app, iframe } = await renderApp();
        const filters = [{ columnName: 'col', operator: 'EQ', values: ['v1'] }];
        await executeAfterWait(() => {
            app.trigger(HostEvent.UpdateRuntimeFilters, filters as any);
            const call = (iframe.contentWindow.postMessage as jest.Mock).mock.calls[0];
            const sentData = call[0].data;
            // Array payload with no vizId property injected
            expect((sentData as any).vizId).toBeUndefined();
            expect(sentData).toEqual(filters);
        });
    });
});

// ---------------------------------------------------------------------------
// Present — vizId injection on LiveboardEmbed
// ---------------------------------------------------------------------------
describe('HostEvent.Present — vizId injection on LiveboardEmbed', () => {
    test('viewConfig.vizId is injected into the Present payload', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard({ vizId });
        await executeAfterWait(() => {
            lb.trigger(HostEvent.Present, {} as any);
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ vizId }),
                }),
                thoughtSpotHost,
                expect.anything(),
            );
        });
    });
});

// ---------------------------------------------------------------------------
// DownloadAsCsv — additional cases
// ---------------------------------------------------------------------------
describe('HostEvent.DownloadAsCsv — additional cases', () => {
    test('viewConfig.vizId overwrites an explicit payload vizId', async () => {
        mockMessageChannel();
        const { lb, iframe } = await renderLiveboard({ vizId });
        await executeAfterWait(() => {
            lb.trigger(HostEvent.DownloadAsCsv, { vizId: 'explicit-id' } as any);
            const call = (iframe.contentWindow.postMessage as jest.Mock).mock.calls[0];
            const sentData = call[0].data;
            expect(sentData.vizId).toBe(vizId); // viewConfig.vizId wins
        });
    });

    test('returns null and calls handleError when !isRendered', async () => {
        const lb = unrenderedLiveboard();
        const result = await lb.trigger(HostEvent.DownloadAsCsv, {} as any);
        expect(result).toBeNull();
        expect((lb as any).handleError).toHaveBeenCalledWith(
            expect.objectContaining({ code: EmbedErrorCodes.RENDER_NOT_CALLED }),
        );
    });

    test('returns null and logs debug when !iFrame', async () => {
        const lb = new LiveboardEmbed(getRootEl(), {
            frameParams: { width: '100%', height: '100%' },
            liveboardId,
        });
        // Don't render — iFrame is null
        jest.spyOn(lb as any, 'handleError').mockImplementation(() => {});
        const result = await lb.trigger(HostEvent.DownloadAsCsv, {} as any);
        // !isRendered is checked before !iFrame, so handleError fires for RENDER_NOT_CALLED
        expect(result).toBeNull();
    });
});
