import { getViewPropsAndListeners } from './util';
import { EmbedEvent, MessageCallback } from '../types';

describe('React util functions', () => {
    describe('getViewPropsAndListeners', () => {
        test('should return empty viewConfig and listeners for empty props', () => {
            const props = {};
            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({});
            expect(result.listeners).toEqual({});
        });

        test('should separate view config properties from props', () => {
            const props = {
                frameParams: { width: 100, height: 200 },
                showLiveboardTitle: true,
                liveboardId: 'test-liveboard-id',
                vizId: 'test-viz-id',
                className: 'test-class',
                style: { color: 'red' },
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({
                frameParams: { width: 100, height: 200 },
                showLiveboardTitle: true,
                liveboardId: 'test-liveboard-id',
                vizId: 'test-viz-id',
                className: 'test-class',
                style: { color: 'red' },
            });
            expect(result.listeners).toEqual({});
        });

        test('should separate event handlers from props', () => {
            const onInit: MessageCallback = jest.fn();
            const onLoad: MessageCallback = jest.fn();
            const onData: MessageCallback = jest.fn();

            const props = {
                onInit,
                onLoad,
                onData,
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({});
            expect(result.listeners).toEqual({
                [EmbedEvent.Init]: onInit,
                [EmbedEvent.Load]: onLoad,
                [EmbedEvent.Data]: onData,
            });
        });

        test('should handle both view config and event handlers', () => {
            const onInit: MessageCallback = jest.fn();
            const onAuthInit: MessageCallback = jest.fn();
            const onQueryChanged: MessageCallback = jest.fn();

            const props = {
                liveboardId: 'test-liveboard-id',
                showLiveboardTitle: false,
                frameParams: { height: 500 },
                onInit,
                onAuthInit,
                onQueryChanged,
                className: 'embed-container',
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({
                liveboardId: 'test-liveboard-id',
                showLiveboardTitle: false,
                frameParams: { height: 500 },
                className: 'embed-container',
            });
            expect(result.listeners).toEqual({
                [EmbedEvent.Init]: onInit,
                [EmbedEvent.AuthInit]: onAuthInit,
                [EmbedEvent.QueryChanged]: onQueryChanged,
            });
        });

        test('all onX props map to their correct EmbedEvent listener keys', () => {
            const onDrilldown: MessageCallback = jest.fn();
            const onDataSourceSelected: MessageCallback = jest.fn();
            const onAddRemoveColumns: MessageCallback = jest.fn();
            const onVizPointDoubleClick: MessageCallback = jest.fn();
            const onVizPointClick: MessageCallback = jest.fn();
            const onAlert: MessageCallback = jest.fn();
            const onGetDataClick: MessageCallback = jest.fn();
            const onDialogClose: MessageCallback = jest.fn();
            const onDownload: MessageCallback = jest.fn();
            const onDownloadAsPng: MessageCallback = jest.fn();
            const onDownloadAsPdf: MessageCallback = jest.fn();
            const onDownloadAsCsv: MessageCallback = jest.fn();
            const onDownloadAsXlsx: MessageCallback = jest.fn();
            const onDownloadLiveboardAsContinuousPDF: MessageCallback = jest.fn();
            const onAnswerDelete: MessageCallback = jest.fn();
            const onAIHighlights: MessageCallback = jest.fn();
            const onPin: MessageCallback = jest.fn();
            const onSpotIQAnalyze: MessageCallback = jest.fn();
            const onShare: MessageCallback = jest.fn();
            const onDrillInclude: MessageCallback = jest.fn();
            const onDrillExclude: MessageCallback = jest.fn();
            const onCopyToClipboard: MessageCallback = jest.fn();
            const onUpdateTML: MessageCallback = jest.fn();
            const onEditTML: MessageCallback = jest.fn();
            const onExportTML: MessageCallback = jest.fn();
            const onSaveAsView: MessageCallback = jest.fn();
            const onCopyAEdit: MessageCallback = jest.fn();
            const onShowUnderlyingData: MessageCallback = jest.fn();
            const onAnswerChartSwitcher: MessageCallback = jest.fn();
            const onLiveboardInfo: MessageCallback = jest.fn();
            const onAddToFavorites: MessageCallback = jest.fn();
            const onSchedule: MessageCallback = jest.fn();
            const onEdit: MessageCallback = jest.fn();
            const onMakeACopy: MessageCallback = jest.fn();
            const onPresent: MessageCallback = jest.fn();
            const onDelete: MessageCallback = jest.fn();
            const onSchedulesList: MessageCallback = jest.fn();
            const onCancel: MessageCallback = jest.fn();
            const onExplore: MessageCallback = jest.fn();
            const onCopyLink: MessageCallback = jest.fn();
            const onCrossFilterChanged: MessageCallback = jest.fn();
            const onVizPointRightClick: MessageCallback = jest.fn();
            const onInsertIntoSlide: MessageCallback = jest.fn();
            const onFilterChanged: MessageCallback = jest.fn();
            const onUpdateConnection: MessageCallback = jest.fn();
            const onCreateConnection: MessageCallback = jest.fn();
            const onResetLiveboard: MessageCallback = jest.fn();
            const onChangePersonalizedView: MessageCallback = jest.fn();
            const onCreateWorksheet: MessageCallback = jest.fn();
            const onAskSageInit: MessageCallback = jest.fn();
            const onRename: MessageCallback = jest.fn();
            const onParameterChanged: MessageCallback = jest.fn();
            const onTableVizRendered: MessageCallback = jest.fn();
            const onCreateLiveboard: MessageCallback = jest.fn();
            const onCreateModel: MessageCallback = jest.fn();
            const onSpotterData: MessageCallback = jest.fn();
            const onPreviewSpotterData: MessageCallback = jest.fn();
            const onAddToCoaching: MessageCallback = jest.fn();
            const onDataModelInstructions: MessageCallback = jest.fn();
            const onSpotterQueryTriggered: MessageCallback = jest.fn();
            const onLastPromptEdited: MessageCallback = jest.fn();
            const onLastPromptDeleted: MessageCallback = jest.fn();
            const onResetSpotterConversation: MessageCallback = jest.fn();
            const onSpotterInit: MessageCallback = jest.fn();
            const onSpotterLoadComplete: MessageCallback = jest.fn();
            const onOrgSwitched: MessageCallback = jest.fn();
            const onSpotterConversationRenamed: MessageCallback = jest.fn();
            const onSpotterConversationDeleted: MessageCallback = jest.fn();
            const onSpotterConversationSelected: MessageCallback = jest.fn();
            const onEmbedPageContextChanged: MessageCallback = jest.fn();
            const onSubscribed: MessageCallback = jest.fn();
            const onSendTestScheduleEmail: MessageCallback = jest.fn();
            const onSpotterVizInit: MessageCallback = jest.fn();
            const onSpotterVizQueryTriggered: MessageCallback = jest.fn();
            const onSpotterVizResponseComplete: MessageCallback = jest.fn();
            const onSpotterVizCheckpointCreated: MessageCallback = jest.fn();
            const onSpotterVizCheckpointRestored: MessageCallback = jest.fn();
            const onSpotterVizError: MessageCallback = jest.fn();
            const onSpotterVizClosed: MessageCallback = jest.fn();
            const onRefreshLiveboardBrowserCache: MessageCallback = jest.fn();
            const onV1Data: MessageCallback = jest.fn();

            const props = {
                onDrilldown,
                onDataSourceSelected,
                onAddRemoveColumns,
                onVizPointDoubleClick,
                onVizPointClick,
                onAlert,
                onGetDataClick,
                onDialogClose,
                onDownload,
                onDownloadAsPng,
                onDownloadAsPdf,
                onDownloadAsCsv,
                onDownloadAsXlsx,
                onDownloadLiveboardAsContinuousPDF,
                onAnswerDelete,
                onAIHighlights,
                onPin,
                onSpotIQAnalyze,
                onShare,
                onDrillInclude,
                onDrillExclude,
                onCopyToClipboard,
                onUpdateTML,
                onEditTML,
                onExportTML,
                onSaveAsView,
                onCopyAEdit,
                onShowUnderlyingData,
                onAnswerChartSwitcher,
                onLiveboardInfo,
                onAddToFavorites,
                onSchedule,
                onEdit,
                onMakeACopy,
                onPresent,
                onDelete,
                onSchedulesList,
                onCancel,
                onExplore,
                onCopyLink,
                onCrossFilterChanged,
                onVizPointRightClick,
                onInsertIntoSlide,
                onFilterChanged,
                onUpdateConnection,
                onCreateConnection,
                onResetLiveboard,
                onChangePersonalizedView,
                onCreateWorksheet,
                onAskSageInit,
                onRename,
                onParameterChanged,
                onTableVizRendered,
                onCreateLiveboard,
                onCreateModel,
                onSpotterData,
                onPreviewSpotterData,
                onAddToCoaching,
                onDataModelInstructions,
                onSpotterQueryTriggered,
                onLastPromptEdited,
                onLastPromptDeleted,
                onResetSpotterConversation,
                onSpotterInit,
                onSpotterLoadComplete,
                onOrgSwitched,
                onSpotterConversationRenamed,
                onSpotterConversationDeleted,
                onSpotterConversationSelected,
                onEmbedPageContextChanged,
                onSubscribed,
                onSendTestScheduleEmail,
                onSpotterVizInit,
                onSpotterVizQueryTriggered,
                onSpotterVizResponseComplete,
                onSpotterVizCheckpointCreated,
                onSpotterVizCheckpointRestored,
                onSpotterVizError,
                onSpotterVizClosed,
                onRefreshLiveboardBrowserCache,
                onV1Data,
            };

            const result = getViewPropsAndListeners(props);

            expect(result.viewConfig).toEqual({});
            expect(result.listeners).toEqual({
                [EmbedEvent.Drilldown]: onDrilldown,
                [EmbedEvent.DataSourceSelected]: onDataSourceSelected,
                [EmbedEvent.AddRemoveColumns]: onAddRemoveColumns,
                [EmbedEvent.VizPointDoubleClick]: onVizPointDoubleClick,
                [EmbedEvent.VizPointClick]: onVizPointClick,
                [EmbedEvent.Alert]: onAlert,
                [EmbedEvent.GetDataClick]: onGetDataClick,
                [EmbedEvent.DialogClose]: onDialogClose,
                [EmbedEvent.Download]: onDownload,
                [EmbedEvent.DownloadAsPng]: onDownloadAsPng,
                [EmbedEvent.DownloadAsPdf]: onDownloadAsPdf,
                [EmbedEvent.DownloadAsCsv]: onDownloadAsCsv,
                [EmbedEvent.DownloadAsXlsx]: onDownloadAsXlsx,
                [EmbedEvent.DownloadLiveboardAsContinuousPDF]: onDownloadLiveboardAsContinuousPDF,
                [EmbedEvent.AnswerDelete]: onAnswerDelete,
                [EmbedEvent.AIHighlights]: onAIHighlights,
                [EmbedEvent.Pin]: onPin,
                [EmbedEvent.SpotIQAnalyze]: onSpotIQAnalyze,
                [EmbedEvent.Share]: onShare,
                [EmbedEvent.DrillInclude]: onDrillInclude,
                [EmbedEvent.DrillExclude]: onDrillExclude,
                [EmbedEvent.CopyToClipboard]: onCopyToClipboard,
                [EmbedEvent.UpdateTML]: onUpdateTML,
                [EmbedEvent.EditTML]: onEditTML,
                [EmbedEvent.ExportTML]: onExportTML,
                [EmbedEvent.SaveAsView]: onSaveAsView,
                [EmbedEvent.CopyAEdit]: onCopyAEdit,
                [EmbedEvent.ShowUnderlyingData]: onShowUnderlyingData,
                [EmbedEvent.AnswerChartSwitcher]: onAnswerChartSwitcher,
                [EmbedEvent.LiveboardInfo]: onLiveboardInfo,
                [EmbedEvent.AddToFavorites]: onAddToFavorites,
                [EmbedEvent.Schedule]: onSchedule,
                [EmbedEvent.Edit]: onEdit,
                [EmbedEvent.MakeACopy]: onMakeACopy,
                [EmbedEvent.Present]: onPresent,
                [EmbedEvent.Delete]: onDelete,
                [EmbedEvent.SchedulesList]: onSchedulesList,
                [EmbedEvent.Cancel]: onCancel,
                [EmbedEvent.Explore]: onExplore,
                [EmbedEvent.CopyLink]: onCopyLink,
                [EmbedEvent.CrossFilterChanged]: onCrossFilterChanged,
                [EmbedEvent.VizPointRightClick]: onVizPointRightClick,
                [EmbedEvent.InsertIntoSlide]: onInsertIntoSlide,
                [EmbedEvent.FilterChanged]: onFilterChanged,
                [EmbedEvent.UpdateConnection]: onUpdateConnection,
                [EmbedEvent.CreateConnection]: onCreateConnection,
                [EmbedEvent.ResetLiveboard]: onResetLiveboard,
                [EmbedEvent.ChangePersonalizedView]: onChangePersonalizedView,
                [EmbedEvent.CreateWorksheet]: onCreateWorksheet,
                [EmbedEvent.AskSageInit]: onAskSageInit,
                [EmbedEvent.Rename]: onRename,
                [EmbedEvent.ParameterChanged]: onParameterChanged,
                [EmbedEvent.TableVizRendered]: onTableVizRendered,
                [EmbedEvent.CreateLiveboard]: onCreateLiveboard,
                [EmbedEvent.CreateModel]: onCreateModel,
                [EmbedEvent.SpotterData]: onSpotterData,
                [EmbedEvent.PreviewSpotterData]: onPreviewSpotterData,
                [EmbedEvent.AddToCoaching]: onAddToCoaching,
                [EmbedEvent.DataModelInstructions]: onDataModelInstructions,
                [EmbedEvent.SpotterQueryTriggered]: onSpotterQueryTriggered,
                [EmbedEvent.LastPromptEdited]: onLastPromptEdited,
                [EmbedEvent.LastPromptDeleted]: onLastPromptDeleted,
                [EmbedEvent.ResetSpotterConversation]: onResetSpotterConversation,
                [EmbedEvent.SpotterInit]: onSpotterInit,
                [EmbedEvent.SpotterLoadComplete]: onSpotterLoadComplete,
                [EmbedEvent.OrgSwitched]: onOrgSwitched,
                [EmbedEvent.SpotterConversationRenamed]: onSpotterConversationRenamed,
                [EmbedEvent.SpotterConversationDeleted]: onSpotterConversationDeleted,
                [EmbedEvent.SpotterConversationSelected]: onSpotterConversationSelected,
                [EmbedEvent.EmbedPageContextChanged]: onEmbedPageContextChanged,
                [EmbedEvent.Subscribed]: onSubscribed,
                [EmbedEvent.SendTestScheduleEmail]: onSendTestScheduleEmail,
                [EmbedEvent.SpotterVizInit]: onSpotterVizInit,
                [EmbedEvent.SpotterVizQueryTriggered]: onSpotterVizQueryTriggered,
                [EmbedEvent.SpotterVizResponseComplete]: onSpotterVizResponseComplete,
                [EmbedEvent.SpotterVizCheckpointCreated]: onSpotterVizCheckpointCreated,
                [EmbedEvent.SpotterVizCheckpointRestored]: onSpotterVizCheckpointRestored,
                [EmbedEvent.SpotterVizError]: onSpotterVizError,
                [EmbedEvent.SpotterVizClosed]: onSpotterVizClosed,
                [EmbedEvent.RefreshLiveboardBrowserCache]: onRefreshLiveboardBrowserCache,
                [EmbedEvent.V1Data]: onV1Data,
            });
        });
    });
});
