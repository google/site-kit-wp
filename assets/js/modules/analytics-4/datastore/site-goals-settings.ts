/**
 * `modules/analytics-4` data store: site goals settings.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	Select,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import {
	combineStores,
	createValidatedAction,
} from '@/js/googlesitekit/data/utils';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalDriverSelectionState } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { VisitorEngagementSelectionState } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement/registry';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	CONVERSION_REPORTING_LEAD_EVENTS,
	MODULES_ANALYTICS_4,
} from './constants';

const { setErrorForAction, clearActionError } = errorStoreActions;

/**
 * Conversion events that belong to each Site Goals widget category.
 *
 * Mirrors the pairing in
 * `Conversion_Reporting_Provider::update_active_site_goals_widgets()`, which
 * pairs `ECOMMERCE_EVENT_NAMES`/`LEAD_EVENT_NAMES` with the same categories
 * when it populates the site-wide `activeWidgets` list.
 */
const SITE_GOALS_WIDGET_EVENTS: Record< string, string[] > = {
	[ GOAL_TYPES.ECOMMERCE ]: CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	[ GOAL_TYPES.LEAD ]: CONVERSION_REPORTING_LEAD_EVENTS,
};

/**
 * Per-user fields that the SAVE endpoint accepts.
 */
export interface PerUserSiteGoalsSettings {
	goalDrivers?: GoalDriverSelectionState;
	visitorEngagement?: VisitorEngagementSelectionState;
}

/**
 * Full merged settings returned by the GET endpoint.
 */
export interface SiteGoalsSettings extends PerUserSiteGoalsSettings {
	activeWidgets?: string[];
}

interface State {
	siteGoalsSettings?: SiteGoalsSettings;
	isFetchingSaveSiteGoalsSettings?: Record< string, boolean >;
	breakdownTooltipPending?: boolean;
}

const SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING =
	'SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING';

interface SetBreakdownTooltipPendingAction {
	type: typeof SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING;
	payload: { isPending: boolean };
}

/**
 * Result shape returned by the fetch-store save action.
 */
type SaveResult = { response?: PerUserSiteGoalsSettings; error?: unknown };

/**
 * Minimal typed view over the registry exposed inside the generator actions and
 * resolvers. The shared redux-routine/registry infrastructure is untyped JS, so
 * only the selectors this store actually reaches are declared here.
 */
interface SiteGoalsRegistry {
	select: ( store: string ) => {
		getSiteGoalsSettings: () => SiteGoalsSettings | undefined;
	};
	resolveSelect: ( store: string ) => {
		getSiteGoalsSettings: () => Promise< SiteGoalsSettings | undefined >;
	};
}

/**
 * Validates the per-goal-type selections of a site goals setting.
 *
 * @since 1.181.0
 *
 * @param {*}      selections Goal type selections to validate.
 * @param {string} key        The setting key the selections belong to.
 * @return {void}
 */
function validateGoalTypeSelections( selections: unknown, key: string ): void {
	invariant( isPlainObject( selections ), `${ key } should be an object.` );

	const goalTypeSelections = selections as Record< string, unknown >;

	// Goal type sub-keys come from the shared GOAL_TYPES source of truth.
	Object.values( GOAL_TYPES ).forEach( ( goalType ) => {
		if ( goalTypeSelections[ goalType ] !== undefined ) {
			invariant(
				Array.isArray( goalTypeSelections[ goalType ] ),
				`${ key }.${ goalType } should be an array.`
			);
		}
	} );
}

/**
 * Validates the per-user site goals settings (goalDrivers, visitorEngagement).
 *
 * @since 1.181.0
 *
 * @param {*} settings Per-user site goals settings to validate.
 * @return {void}
 */
function validateSiteGoalsSettings( settings: unknown ): void {
	invariant( isPlainObject( settings ), 'settings should be an object.' );

	const siteGoalsSettings = settings as Record< string, unknown >;

	[ 'goalDrivers', 'visitorEngagement' ].forEach( ( key ) => {
		if ( siteGoalsSettings[ key ] !== undefined ) {
			validateGoalTypeSelections( siteGoalsSettings[ key ], key );
		}
	} );
}

const fetchGetSiteGoalsSettingsStore = createFetchStore( {
	baseName: 'getSiteGoalsSettings',
	controlCallback() {
		return get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'site-goals-settings',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback: createReducer(
		( state: State, settings: SiteGoalsSettings ) => {
			state.siteGoalsSettings = settings;
		}
	),
} ) as {
	actions: { fetchGetSiteGoalsSettings: () => unknown };
};

const fetchSaveSiteGoalsSettingsStore = createFetchStore( {
	baseName: 'saveSiteGoalsSettings',
	controlCallback: ( settings: PerUserSiteGoalsSettings ) =>
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'save-site-goals-settings', {
			settings,
		} ),
	reducerCallback: createReducer(
		( state: State, perUserSettings: PerUserSiteGoalsSettings ) => {
			// Merge the per-user response over existing settings, preserving
			// site-wide activeWidgets already in state.
			state.siteGoalsSettings = {
				...state.siteGoalsSettings,
				...perUserSettings,
			};
		}
	),
	argsToParams: ( settings: PerUserSiteGoalsSettings ) => settings,
	validateParams: validateSiteGoalsSettings,
	isAction: true,
} ) as {
	actions: {
		fetchSaveSiteGoalsSettings: (
			settings: PerUserSiteGoalsSettings
		) => unknown;
	};
};

const baseInitialState: State = {
	siteGoalsSettings: undefined,
	breakdownTooltipPending: false,
};

const baseReducer = createReducer(
	( state: State, action: SetBreakdownTooltipPendingAction ) => {
		switch ( action.type ) {
			case SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING:
				state.breakdownTooltipPending = action.payload.isPending;
				break;

			default:
				break;
		}
	}
);

const baseActions = {
	/**
	 * Saves the per-user site goals settings (goalDrivers, visitorEngagement).
	 *
	 * @since 1.181.0
	 *
	 * @param {Object} settings Partial per-user site goals settings to save.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveSiteGoalsSettings: createValidatedAction(
		( settings: PerUserSiteGoalsSettings ) => {
			validateSiteGoalsSettings( settings );
		},
		function* (
			settings: PerUserSiteGoalsSettings
		): Generator< unknown, SaveResult, unknown > {
			yield clearActionError( 'saveSiteGoalsSettings', [] );

			const registry =
				( yield commonActions.getRegistry() ) as SiteGoalsRegistry;

			const currentSettings = ( yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getSiteGoalsSettings()
			) ) as SiteGoalsSettings | undefined;

			// Only send the per-user fields to the save endpoint.
			const perUserSettings: PerUserSiteGoalsSettings = {
				...( currentSettings?.goalDrivers !== undefined && {
					goalDrivers: currentSettings.goalDrivers,
				} ),
				...( currentSettings?.visitorEngagement !== undefined && {
					visitorEngagement: currentSettings.visitorEngagement,
				} ),
				...settings,
			};

			const { response, error } =
				( yield fetchSaveSiteGoalsSettingsStore.actions.fetchSaveSiteGoalsSettings(
					perUserSettings
				) ) as SaveResult;

			if ( error ) {
				yield setErrorForAction( error, 'saveSiteGoalsSettings', [] );
			}

			return { response, error };
		}
	),

	/**
	 * Marks the breakdown notice tooltip as pending, so the Side Panel parent
	 * shows it once the panel overlay closes.
	 *
	 * @since 1.181.0
	 *
	 * @return {Object} Redux-style action.
	 */
	setSiteGoalsBreakdownTooltipPending(): SetBreakdownTooltipPendingAction {
		return {
			type: SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING,
			payload: { isPending: true },
		};
	},

	/**
	 * Clears the pending breakdown notice tooltip flag.
	 *
	 * @since 1.181.0
	 *
	 * @return {Object} Redux-style action.
	 */
	clearSiteGoalsBreakdownTooltipPending(): SetBreakdownTooltipPendingAction {
		return {
			type: SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING,
			payload: { isPending: false },
		};
	},
};

const baseResolvers = {
	*getSiteGoalsSettings(): Generator< unknown, void, unknown > {
		const registry =
			( yield commonActions.getRegistry() ) as SiteGoalsRegistry;

		if (
			registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings() ===
			undefined
		) {
			yield fetchGetSiteGoalsSettingsStore.actions.fetchGetSiteGoalsSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the merged site goals settings (per-user + site-wide).
	 *
	 * @since 1.181.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Site goals settings, or `undefined` if not loaded.
	 */
	getSiteGoalsSettings( state: State ): SiteGoalsSettings | undefined {
		return state.siteGoalsSettings;
	},

	/**
	 * Gets the selected site goals goal drivers.
	 *
	 * @since 1.181.0
	 *
	 * @return {Object|undefined} Goal driver selections, or `undefined` if not loaded.
	 */
	getSiteGoalsGoalDrivers: createRegistrySelector(
		( select: Select ) => () =>
			select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()?.goalDrivers
	),

	/**
	 * Gets the selected site goals visitor engagement events.
	 *
	 * @since 1.181.0
	 *
	 * @return {Object|undefined} Visitor engagement selections, or `undefined` if not loaded.
	 */
	getSiteGoalsVisitorEngagement: createRegistrySelector(
		( select: Select ) => () =>
			select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
				?.visitorEngagement
	),

	/**
	 * Checks whether a given widget category is active.
	 *
	 * Reads only the site-wide `activeWidgets` list, which the conversion
	 * reporting cron populates once a category's events are detected and one of
	 * its event provider plugins is active. That list is only ever unioned, so a
	 * category stays in it after the provider is deactivated.
	 *
	 * To decide whether a widget actually renders, use
	 * `isSiteGoalsWidgetRenderable()` instead, which also accounts for the events
	 * still being detected.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} category Widget category slug (e.g. 'lead' or 'ecommerce').
	 * @return {boolean|undefined} `true` if active, `false` if not, `undefined` if not loaded.
	 */
	isSiteGoalsWidgetActive: createRegistrySelector(
		( select: Select ) =>
			( _state: State, category: string ): boolean | undefined => {
				const settings =
					select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings();
				if ( settings === undefined ) {
					return undefined;
				}
				return ( settings.activeWidgets ?? [] ).includes( category );
			}
	),

	/**
	 * Checks whether a given widget category's widget will render.
	 *
	 * Combines the site-wide `activeWidgets` entry with the events currently
	 * detected for the same category. Together, these are the conditions the
	 * widget's registration and its own zero state use to determine if it should
	 * render.
	 *
	 * This is the single source of truth for every Site Goals surface
	 * that depends on a widget being on the page (eg. widget registration,
	 * intro modal, feature tour, and survey triggers). These never show for
	 * a widget that is not rendered.
	 *
	 * @since 1.185.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} category Widget category slug (e.g. 'lead' or 'ecommerce').
	 * @return {boolean|undefined} `true` if the widget renders, `false` if not, `undefined` if not loaded.
	 */
	isSiteGoalsWidgetRenderable: createRegistrySelector(
		( select: Select ) =>
			( _state: State, category: string ): boolean | undefined => {
				const events = SITE_GOALS_WIDGET_EVENTS[ category ];

				if ( ! events ) {
					return false;
				}

				const isActive =
					select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetActive(
						category
					);
				const hasEvents =
					select( MODULES_ANALYTICS_4 ).hasConversionReportingEvents(
						events
					);

				if ( isActive === undefined || hasEvents === undefined ) {
					return undefined;
				}

				return isActive && hasEvents;
			}
	),

	/**
	 * Checks whether the site goals settings are currently being saved.
	 *
	 * @since 1.181.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if the settings are being saved, otherwise `false`.
	 */
	isSavingSiteGoalsSettings( state: State ): boolean {
		return Object.values(
			state.isFetchingSaveSiteGoalsSettings || {}
		).some( Boolean );
	},

	/**
	 * Checks whether the breakdown notice tooltip is pending (deferred from the
	 * Side Panel until it closes).
	 *
	 * @since 1.181.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if the tooltip is pending, otherwise `false`.
	 */
	isSiteGoalsBreakdownTooltipPending( state: State ): boolean {
		return !! state.breakdownTooltipPending;
	},
};

// `combineStores` is untyped JS and returns `Object`, so the combined shape is
// asserted here to keep the re-exports typed.
interface Store {
	initialState: State;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores(
	fetchGetSiteGoalsSettingsStore,
	fetchSaveSiteGoalsSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
