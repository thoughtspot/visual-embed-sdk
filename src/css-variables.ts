/**
 * The list of customization css variables. These
 * are the only allowed variables possible.
 */
export interface CustomCssVariables {
    /**
     * Background color of the Liveboard, visualization, Search, and Answer pages.
     */
    '--ts-var-root-background'?: string;

    /**
     * Color of the text on application pages.
     */
    '--ts-var-root-color'?: string;

    /**
     * Font type for the text on application pages.
     */
    '--ts-var-root-font-family'?: string;

    /**
     * Text transformation specification for UI elements in the app.
     */
    '--ts-var-root-text-transform'?: string;

    /**
     * Font color of the text on toggle buttons such as
     * **All**, **Answers**, and **Liveboards** on the Home page (Classic experience),
     * the text color of the chart and table tiles on Home page (New modular Homepage
     * experience), title text on the AI-generated charts and tables, and object titles on
     * list pages such as *Liveboards* and *Answers*.
     * The default color code is #2770EF.
     *
     */
    '--ts-var-application-color'?: string;

    /**
     * Background color of the top navigation panel.
     */
    '--ts-var-nav-background'?: string;

    /**
     * Font color of the top navigation panel.
     */
    '--ts-var-nav-color'?: string;

    /**
     * Background color of the *Search data* button.
     */
    '--ts-var-search-data-button-background'?: string;

    /**
     * Color of the text on the *Search data* button.
     */
    '--ts-var-search-data-button-font-color'?: string;

    /**
     * Font of the text on the *Search data* button.
     */
    '--ts-var-search-data-button-font-family'?: string;

    /**
     * Font color of the text in the Search bar.
     */
    '--ts-var-search-bar-text-font-color'?: string;

    /**
     * Font of the text in the Search bar.
     */
    '--ts-var-search-bar-text-font-family'?: string;

    /**
     * Font style of the text in the Search bar.
     */
    '--ts-var-search-bar-text-font-style'?: string;

    /**
     * Background color of the search bar.
     */
    '--ts-var-search-bar-background'?: string;

    /**
     * Background color of the search suggestions panel.
     */
    '--ts-var-search-auto-complete-background'?: string;

    /**
     * Background color of the navigation panel that allows you to undo, redo, and reset
     * search operations.
     */
    '--ts-var-search-navigation-button-background'?: string;

    /**
     * Background color of the navigation help text that appears at the bottom of the
     * search suggestions panel.
     */
    '--ts-var-search-bar-navigation-help-text-background'?: string;

    /**
     * Background color of the search suggestion block on hover.
     */
    '--ts-var-search-bar-auto-complete-hover-background'?: string;

    /**
     * Font color of the text in the search suggestion panel.
     */
    '--ts-var-search-auto-complete-font-color'?: string;

    /**
     * Font color of the sub-text that appears below the keyword in the search suggestion
     * panel.
     */
    '--ts-var-search-auto-complete-subtext-font-color'?: string;

    /**
     * Background color of the input box in the Spotter page.
     */
    '--ts-var-spotter-input-background'?: string;

    /**
     * Background color of the previously asked prompt message in the Spotter page.
     */
    '--ts-var-spotter-prompt-background'?: string;

    /**
     * Background color of the data panel.
     */
    '--ts-var-answer-data-panel-background-color'?: string;

    /**
     * Background color of the vertical panel on the right side of the Answer page, which
     * includes the options to edit charts and tables.
     */
    '--ts-var-answer-edit-panel-background-color'?: string;

    /**
     * Background color of the chart switcher on search results and Answer pages.
     */
    '--ts-var-answer-view-table-chart-switcher-background'?: string;

    /**
     * Background color of the currently selected chart type in the chart switcher.
     */
    '--ts-var-answer-view-table-chart-switcher-active-background'?: string;

    /**
     * Border-radius of main buttons.
     * For example, the *Search data* button in the top navigation panel.
     */
    '--ts-var-button-border-radius'?: string;

    /**
     * Border-radius of small buttons such as secondary buttons.
     * For example, share and favorite buttons.
     */
    '--ts-var-button--icon-border-radius'?: string;

    /**
     * Font color of the text on primary buttons. For example, the primary buttons on
     * Liveboard*, Answer, *Data* workspace, *SpotIQ*, or *Home* page.
     */
    '--ts-var-button--primary-color'?: string;

    /**
     * Font family specification for the text on primary buttons.
     */
    '--ts-var-button--primary--font-family'?: string;

    /**
     * Background color of the primary buttons. For example, the primary buttons such as
     * Pin* and *Save*.
     */
    '--ts-var-button--primary-background'?: string;

    /**
     * Background color of the primary buttons on hover.
     */
    '--ts-var-button--primary--hover-background'?: string;

    /**
     * Backgroud color of the primary buttons when active.
     */
    '--ts-var-button--primary--active-background'?: string;

    /**
     * Font color of the text on the secondary buttons.
     */
    '--ts-var-button--secondary-color'?: string;

    /**
     * Font family specification for the text on the secondary buttons.
     */
    '--ts-var-button--secondary--font-family'?: string;

    /**
     * Background color of the secondary buttons.
     */
    '--ts-var-button--secondary-background'?: string;

    /**
     * Background color of the secondary button on hover.
     */
    '--ts-var-button--secondary--hover-background'?: string;

    /**
     * Backgroud color of the secondary buttons when active.
     */
    '--ts-var-button--secondary--active-background'?: string;

    /**
     * Font color of the tertiary button. For example, the *Undo*, *Redo*, and *Reset*
     * buttons on the *Search* page.
     */
    '--ts-var-button--tertiary-color'?: string;

    /**
     * Background color of the tertiary button.
     */
    '--ts-var-button--tertiary-background'?: string;

    /**
     * Background color of the tertiary button when a user hovers over these buttons.
     */
    '--ts-var-button--tertiary--hover-background'?: string;

    /**
     * Backgroud color of the tertiary buttons when active.
     */
    '--ts-var-button--tertiary--active-background'?: string;

    /**
     * Font color of the title text of a visualization or Answer.
     */
    '--ts-var-viz-title-color'?: string;

    /**
     * Font family specification for the title text of a visualization/Answer.
     */
    '--ts-var-viz-title-font-family'?: string;

    /**
     * Text transformation specification for visualization and Answer titles.
     */
    '--ts-var-viz-title-text-transform'?: string;

    /**
     * Font color of the description text and subtitle of a visualization or Answer.
     */
    '--ts-var-viz-description-color'?: string;

    /**
     * Font family specification of description text and subtitle of a visualization or
     * Answer.
     */
    '--ts-var-viz-description-font-family'?: string;

    /**
     * Text transformation specification for  description text and subtitle of a
     * visualization or Answer.
     */
    '--ts-var-viz-description-text-transform'?: string;

    /**
     * Border-radius for the visualization tiles and header panel on a Liveboard.
     */
    '--ts-var-viz-border-radius'?: string;

    /**
     * Box shadow property for the visualization tiles and header panel on a Liveboard.
     */
    '--ts-var-viz-box-shadow'?: string;

    /**
     * Background color of the visualization tiles and header panel on a Liveboard.
     */
    '--ts-var-viz-background'?: string;

    /**
     * Background color of the legend on a visualization or Answer.
     */
    '--ts-var-viz-legend-hover-background'?: string;

    /**
     * Background color of the selected chart type on the chart selection widget.
     */
    '--ts-var-answer-chart-select-background'?: string;

    /**
     * Background color of the chart type element when a user hovers over a chart type on
     * the chart selection widget.
     */
    '--ts-var-answer-chart-hover-background'?: string;

    /**
     * Border-radius of filter chips.
     */
    '--ts-var-chip-border-radius'?: string;

    /**
     * Shadow effect for filter chips.
     */
    '--ts-var-chip-box-shadow'?: string;

    /**
     * Background color of filter chips.
     */
    '--ts-var-chip-background'?: string;

    /**
     * Font color of the filter label when a filter chip is selected
     */
    '--ts-var-chip--active-color'?: string;

    /**
     * Background color of the filter chips when selected.
     */
    '--ts-var-chip--active-background'?: string;

    /**
     * Font color of the text on filter chips when hovered over.
     */
    '--ts-var-chip--hover-color'?: string;

    /**
     * Background color of filter chips on hover.
     */
    '--ts-var-chip--hover-background'?: string;

    /**
     * Font color of the text on filter chips.
     */
    '--ts-var-chip-color'?: string;

    /**
     * Font family specification for the text on filter chips.
     */
    '--ts-var-chip-title-font-family'?: string;

    /**
     * Font color of axis title on charts.
     */
    '--ts-var-axis-title-color'?: string;

    /**
     * Font family specification for the X and Y axis title text.
     */
    '--ts-var-axis-title-font-family'?: string;

    /**
     * Font color of the X and Y axis labels.
     */
    '--ts-var-axis-data-label-color'?: string;

    /**
     * Font family specification for X and Y axis labels.
     */
    '--ts-var-axis-data-label-font-family'?: string;

    /**
     * Font color of the menu items.
     */
    '--ts-var-menu-color'?: string;

    /**
     * Background color of menu panels.
     */
    '--ts-var-menu-background'?: string;

    /**
     * Font family specification for the menu items.
     */
    '--ts-var-menu-font-family'?: string;

    /**
     * Text capitalization specification for the menu items.
     */
    '--ts-var-menu-text-transform'?: string;

    /**
     * Background color for menu items on hover.
     */
    '--ts-var-menu--hover-background'?: string;

    /**
     * Text color for selected menu items.
     */
    '--ts-var-menu-selected-text-color'?: string;

    /**
     * Background color of the dialogs.
     */
    '--ts-var-dialog-body-background'?: string;

    /**
     * Font color of the body text displayed on dialogs.
     */
    '--ts-var-dialog-body-color'?: string;

    /**
     * Background color of the header text on dialogs.
     */
    '--ts-var-dialog-header-background'?: string;

    /**
     * Font color of the header text on dialogs.
     */
    '--ts-var-dialog-header-color'?: string;

    /**
     * Background color of the footer area on dialogs.
     */
    '--ts-var-dialog-footer-background'?: string;

    /**
     * Background for selected state in list
     */
    '--ts-var-list-selected-background'?: string;

    /**
     * Background for hover state in list
     */
    '--ts-var-list-hover-background'?: string;

    /**
     * Background for hover state in segment control.
     */
    '--ts-var-segment-control-hover-background'?: string;

    /**
     * Text color for slected item in modular home's watchlist.
     */
    '--ts-var-home-watchlist-selected-text-color'?: string;

    /**
     * Text color for favorite carousel find your favorites card in modular home.
     */
    '--ts-var-home-favorite-suggestion-card-text-color'?: string;

    /**
     * Icon color for favorite carousel find your favorites card in modular home.
     */
    '--ts-var-home-favorite-suggestion-card-icon-color'?: string;

    /**
     * Background for favorite carousel find your favorites card in modular home.
     */
    '--ts-var-home-favorite-suggestion-card-background'?: string;
    /**
     * Border color of checkbox in error state.
     */
    '--ts-var-checkbox-error-border'?: string;
    /**
     * Border color of checkbox.
     */
    '--ts-var-checkbox-border-color'?: string;
    /**
     * Border color of checkbox in hover state.
     */
    '--ts-var-checkbox-hover-border'?: string;
    /**
     * Border and font color of checkbox in active state.
     */
    '--ts-var-checkbox-active-color'?: string;
    /**
     * Border color and font color of checkbox in checked state.
     */
    '--ts-var-checkbox-checked-color'?: string;
    /**
     * Border and font color of checkbox in disabled state.
     */
    '--ts-var-checkbox-checked-disabled'?: string;
    /**
     * Background color of checkbox.
     */
    '--ts-var-checkbox-background-color'?: string;

    /**
     * Background color of the layout in the Liveboard.
     */
    '--ts-var-liveboard-layout-background'?: string;

    /**
     * Background color of the header in the Liveboard.
     */
    '--ts-var-liveboard-header-background'?: string;

    /**
     * Font color of the header in the Liveboard.
     */
    '--ts-var-liveboard-header-font-color'?: string;

    /**
     * Border color of the tiles in the Liveboard.
     */
    '--ts-var-liveboard-tile-border-color'?: string;

    /**
     * Background color of the tiles in the Liveboard.
     */
    '--ts-var-liveboard-tile-background'?: string;

    /**
     * Border radius of the tiles in the Liveboard.
     */
    '--ts-var-liveboard-tile-border-radius'?: string;

    /**
     * Padding of the tiles in the Liveboard.
     */
    '--ts-var-liveboard-tile-padding'?: string;

    /**
     * Background color of the table header in the Liveboard.
     */
    '--ts-var-liveboard-tile-table-header-background'?: string;

    /**
     * Padding of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-padding'?: string;

    /**
     * Font size of the title of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-title-font-size'?: string;

    /**
     * Font weight of the title of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-title-font-weight'?: string;

    /**
     * Font size of the title of the tiles inside the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-tile-title-font-size'?: string;

    /**
     * Font weight of the title of the tiles inside the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-tile-title-font-weight'?: string;

    /**
     * Padding of the group tiles in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-tile-padding'?: string;

    /**
     * Padding of the answer viz in the Liveboard.
     */
    '--ts-var-liveboard-answer-viz-padding'?: string;

    /**
     * Background color of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-background'?: string;

    /**
     * Border color of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-border-color'?: string;

    /**
     * Font color of the heading of the note title in the Liveboard.
     */
    '--ts-var-liveboard-notetitle-heading-font-color'?: string;

    /**
     * Font color of the body of the note title in the Liveboard.
     */
    '--ts-var-liveboard-notetitle-body-font-color'?: string;

    /**
     * Font color of the title of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-title-font-color'?: string;

    /**
     * Font color of the description of the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-description-font-color'?: string;

    /**
     * Font color of the title of the tiles inside the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-tile-title-font-color'?: string;

    /**
     * Font color of the description of the tiles inside the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-tile-description-font-color'?: string;

    /**
     * Background color of the tiles inside the groups in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-group-tile-background'?: string;

    /**
     * Background color of the filter chips in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-chip-background'?: string;

    /**
     * Font color of the filter chips in the Liveboard.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-chip-color'?: string;

    /**
     * Background color of the filter chips in the Liveboard on hover.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-chip--hover-background'?: string;

    /**
     * Background color of the filter chips in the Liveboard on active.
     * 
     * Please enable the Liveboard styling and grouping feature in your ThoughtSpot instance and then set the isLiveboardStylingAndGrouping SDK flag to true to start modifying this CSS variable.
     */
    '--ts-var-liveboard-chip--active-background'?: string;

    /**
     * Width of the side panel in the Liveboard.
     */
    '--ts-var-side-panel-width'?: string;

    /**
     * Background color of the edit bar in the Liveboard.
     */
    '--ts-var-liveboard-edit-bar-background'?: string;

    /**
     * Breakpoint for the dual column layout in the Liveboard.
     */
    '--ts-var-liveboard-dual-column-breakpoint'?: string;

    /**
     * Breakpoint for the single column layout in the Liveboard.
     */
    '--ts-var-liveboard-single-column-breakpoint'?: string;

    /**
     * Background color of the cross filter layout in the Liveboard.
     */
    '--ts-var-liveboard-cross-filter-layout-background'?: string;

    /**
     * Border color of the active tab in the Liveboard.
     */
    '--ts-var-liveboard-tab-active-border-color'?: string;

    /**
     * Font color of the hover tab in the Liveboard.
     */
    '--ts-var-liveboard-tab-hover-color'?: string;

    /**
     * Font size of the title of the tiles in the Liveboard.
     */
    '--ts-var-liveboard-tile-title-fontsize'?: string;

    /**
     * Font weight of the title of the tiles in the Liveboard.
     */
    '--ts-var-liveboard-tile-title-fontweight'?: string;

    /**
     * Background color of the parameter chips in the Liveboard.
     */
    '--ts-var-parameter-chip-background'?: string;

    /**
     * Font color of the parameter chips in the Liveboard.
     */
    '--ts-var-parameter-chip-text-color'?: string;

    /**
     * Background color of the parameter chips in the Liveboard on hover.
     */
    '--ts-var-parameter-chip-hover-background'?: string;

    /**
     * Font color of the parameter chips in the Liveboard on hover.
     */
    '--ts-var-parameter-chip-hover-text-color'?: string;

    /**
     * Background color of the parameter chips in the Liveboard on active.
     */
    '--ts-var-parameter-chip-active-background'?: string;

    /**
     * Font color of the parameter chips in the Liveboard on active.
     */
    '--ts-var-parameter-chip-active-text-color'?: string;

    /**
     * Background color of the action button in the Liveboard header.
     */
    '--ts-var-liveboard-header-action-button-background'?: string;

    /**
     * Font color of the action button in the Liveboard header.
     */
    '--ts-var-liveboard-header-action-button-font-color'?: string;

    /**
     * Font color of the action button in the Liveboard header on hover.
     */
    '--ts-var-liveboard-header-action-button-hover-color'?: string;

    /**
     * Font color of the action button in the Liveboard header on active.
     */
    '--ts-var-liveboard-header-action-button-active-color'?: string;

    /**
     * Background color of the badge in the Liveboard header.
     */
    '--ts-var-liveboard-header-badge-background'?: string;

    /**
     * Font color of the badge in the Liveboard header.
     */
    '--ts-var-liveboard-header-badge-font-color'?: string;

    /**
     * Background color of the modified badge in the Liveboard header.
     */
    '--ts-var-liveboard-header-badge-modified-background'?: string;

    /**
     * Font color of the modified badge in the Liveboard header.
     */
    '--ts-var-liveboard-header-badge-modified-font-color'?: string;

    /**
     * Font color of the badge in the Liveboard header on hover.
     */
    '--ts-var-liveboard-header-badge-hover-color'?: string;

    /**
     * Font color of the badge in the Liveboard header on active.
     */
    '--ts-var-liveboard-header-badge-active-color'?: string;

    /**
     * Font color of the hero text in the KPI widget.
     */
    '--ts-var-kpi-hero-color'?: string;

    /**
     * Font color of the comparison text in the KPI widget.
     */
    '--ts-var-kpi-comparison-color'?: string;

    /**
     * Font color of the analyze text in the KPI widget.
     */
    '--ts-var-kpi-analyze-text-color'?: string;

    /**
     * Font color of the legend title in the heatmap chart.
     */
    '--ts-var-chart-heatmap-legend-title-color'?: string;

    /**
     * Font color of the legend label in the heatmap chart.
     */
    '--ts-var-chart-heatmap-legend-label-color'?: string;

    /**
     * Font color of the legend title in the treemap chart.
     */
    '--ts-var-chart-treemap-legend-title-color'?: string;

    /**
     * Font color of the legend label in the treemap chart.
     */
    '--ts-var-chart-treemap-legend-label-color'?: string;

    /**
     * Color of the positive change in the KPI.
     */
    '--ts-var-kpi-positive-change-color'?: string;

    /**
     * Color of the negative change in the KPI.
     */
    '--ts-var-kpi-negative-change-color'?: string;
 
    /**
     * Background color of the change analysis insights.
     */
    '--ts-var-change-analysis-insights-background'?: string;

    /**
     * Background color of the forecasting card in the SpotIQ analyze.
     */
    '--ts-var-spotiq-analyze-forecasting-card-background'?: string;

    /**
     * Background color of the outlier card in the SpotIQ analyze.
     */
    '--ts-var-spotiq-analyze-outlier-card-background'?: string;

    /**
     * Background color of the trend card in the SpotIQ analyze.
     */
    '--ts-var-spotiq-analyze-trend-card-background'?: string;
    
    /**
     * Background color of the crosscorrelation card in the SpotIQ analyze.
     */
    '--ts-var-spotiq-analyze-crosscorrelation-card-background'?: string;
    
    /**
     * Background color of the summary header in the CCA modal.
     */
    '--ts-var-cca-modal-summary-header-background'?: string;
    
    /**
     * Width of the Spotter chat window.
     */
    '--ts-var-spotter-chat-width'?: string;

    /**
     * Border color for the saved chats sidebar container.
     */
    '--ts-var-saved-chats-border-color'?: string;

    /**
     * Background color for the saved chats sidebar container.
     */
    '--ts-var-saved-chats-bg'?: string;

    /**
     * Text color for the saved chats sidebar container.
     */
    '--ts-var-saved-chats-text-color'?: string;

    /**
     * Border color for the saved chats sidebar header.
     */
    '--ts-var-saved-chats-header-border'?: string;

    /**
     * Color for the saved chats sidebar title text.
     */
    '--ts-var-saved-chats-title-color'?: string;

    /**
     * Background color for buttons (new chat, toggle, footer) in the saved chats sidebar.
     */
    '--ts-var-saved-chats-btn-bg'?: string;

    /**
     * Hover background color for buttons in the saved chats sidebar.
     */
    '--ts-var-saved-chats-btn-hover-bg'?: string;

    /**
     * Text color for conversation items in the saved chats sidebar.
     */
    '--ts-var-saved-chats-conv-text-color'?: string;

    /**
     * Background color for conversation items on hover in the saved chats sidebar.
     */
    '--ts-var-saved-chats-conv-hover-bg'?: string;

    /**
     * Background color for the active/selected conversation in the saved chats sidebar.
     */
    '--ts-var-saved-chats-conv-active-bg'?: string;

    /**
     * Border color for the saved chats sidebar footer.
     */
    '--ts-var-saved-chats-footer-border'?: string;

    /**
     * Color for section title text (e.g., "Recent", "Older") in the saved chats sidebar.
     */
    '--ts-var-saved-chats-section-title-color'?: string;
  }