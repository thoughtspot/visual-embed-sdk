/**
 * Copyright (c) 2026
 *
 * Cascading (nested) menu actions — the public contract for menu items that
 * render as a parent with child actions in the ellipsis menu.
 *
 * AUTHORING: this TS file is the source of truth — add/edit entries here using
 * `Action` enum members (typo-proof, autocomplete, refactor-safe). The sibling
 * `cascading-menu-actions.json` is a GENERATED artifact (fetched raw by the
 * main app's drift-gate test); after editing this file regenerate it with:
 *
 *   UPDATE_CASCADE_CONTRACT=1 npx jest src/cascading-menu-actions.spec.ts
 *
 * The spec fails if the JSON is out of sync, so you cannot forget.
 *
 * @summary Cascading menu actions contract
 */
import { Action } from './types';

/**
 * Map of each cascading parent menu item to the child {@link Action}s that
 * appear under it, per embed surface. Parent keys are the parent menu item's
 * internal id.
 *
 * Parent items are UI-derived: with ONE visible child the child replaces the
 * parent inline (no submenu); hiding ALL children (`hiddenActions`) removes
 * the parent entirely; `disabledActions` greys a child out but keeps it in
 * the menu, so the parent stays.
 *
 * Most parents are NOT `Action` members and cannot be targeted directly —
 * control their children instead. Exceptions: on the Liveboard surface the
 * `tml` and `publish` parents are themselves targetable as {@link Action.TML}
 * and {@link Action.Publish}.
 *
 * @example
 * ```js
 * // remove the whole Sync menu on an Answer:
 * hiddenActions: [...CASCADING_MENU_ACTIONS.answer.sync]
 * ```
 * @version SDK: 1.42.0 | ThoughtSpot: *
 */
export const CASCADING_MENU_ACTIONS = {
    /** Answer / visualization ellipsis menu. */
    answer: {
        sync: [Action.SyncToSheets, Action.SyncToOtherApps, Action.ManagePipelines],
    },
    /** Liveboard header ellipsis menu. */
    liveboard: {
        tml: [Action.ExportTML, Action.UpdateTML, Action.EditTML],
        schedule: [Action.Schedule, Action.SchedulesList],
        publish: [Action.ManagePublishing, Action.Unpublish],
        sync: [Action.SyncToSlack, Action.SyncToTeams],
    },
} as const;

/** Embed surface owning a cascading menu. */
export type CascadingMenuSurface = keyof typeof CASCADING_MENU_ACTIONS;

/** Parent menu item ids per surface (e.g. `'sync'`, `'tml'`). */
export type CascadingMenuParentId = {
    [S in CascadingMenuSurface]: keyof (typeof CASCADING_MENU_ACTIONS)[S];
}[CascadingMenuSurface];

/**
 * Cascading parents that are ALSO directly targetable {@link Action} members
 * (Liveboard surface only) — these can be passed to `visibleActions` /
 * `hiddenActions` / `disabledActions` themselves.
 */
export const TARGETABLE_CASCADING_PARENTS = {
    tml: Action.TML,
    publish: Action.Publish,
} as const;

/**
 * Intent-level action groups — the simple way to control a whole cascading
 * menu without knowing its members or which surface it renders on. Each group
 * merges that parent's children across every surface; ids that do not apply
 * to a given embed type are ignored, so a group is safe on any embed.
 *
 * @example
 * ```js
 * // hide the entire Sync menu (viz menu AND Liveboard header):
 * hiddenActions: [...ACTION_GROUPS.sync]
 *
 * // note: the sync group includes Action.ManagePipelines — to keep pipeline
 * // management, hide the destinations explicitly instead:
 * hiddenActions: [Action.SyncToSheets, Action.SyncToOtherApps, Action.SyncToSlack, Action.SyncToTeams]
 * ```
 * @version SDK: 1.42.0 | ThoughtSpot: *
 */
export const ACTION_GROUPS = {
    sync: [...CASCADING_MENU_ACTIONS.answer.sync, ...CASCADING_MENU_ACTIONS.liveboard.sync],
    tml: CASCADING_MENU_ACTIONS.liveboard.tml,
    schedule: CASCADING_MENU_ACTIONS.liveboard.schedule,
    publish: CASCADING_MENU_ACTIONS.liveboard.publish,
} as const;
