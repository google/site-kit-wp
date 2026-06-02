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
import { MODULES_ANALYTICS_4 } from './constants';

const { setErrorForAction, clearActionError } = errorStoreActions;

export interface SiteGoalsSettings {
	goalDrivers?: GoalDriverSelectionState;
	visitorEngagement?: VisitorEngagementSelectionState;
}

interface State {
	siteGoalsSettings?: {
		settings: SiteGoalsSettings;
		savedSettings: SiteGoalsSettings;
	};
	isFetchingSaveSiteGoalsSettings?: Record< string, boolean >;
}

// Result shape returned by the fetch-store save action.
type SaveResult = { response?: SiteGoalsSettings; error?: unknown };

// Minimal typed view over the registry exposed inside the generator actions and
// resolvers. The shared redux-routine/registry infrastructure is untyped JS, so
// only the selectors this store actually reaches are declared here.
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
 * @since n.e.x.t
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
 * Validates site goals settings.
 *
 * @since n.e.x.t
 *
 * @param {*} settings Site goals settings to validate.
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

const fetchStoreReducerCallback = createReducer(
	( state: State, settings: SiteGoalsSettings ) => {
		state.siteGoalsSettings = {
			settings,
			savedSettings: settings,
		};
	}
);

const fetchGetSiteGoalsSettingsStore = createFetchStore( {
	baseName: 'getSiteGoalsSettings',
	controlCallback() {
		return get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'site-goals-settings',
			{},
			// @ts-expect-error -- `get()` infers its options as fully required from the untyped JS source; only `useCache` is needed here.
			{
				useCache: false,
			}
		);
	},
	reducerCallback: fetchStoreReducerCallback,
} ) as {
	actions: { fetchGetSiteGoalsSettings: () => unknown };
};

const fetchSaveSiteGoalsSettingsStore = createFetchStore( {
	baseName: 'saveSiteGoalsSettings',
	controlCallback: ( settings: SiteGoalsSettings ) =>
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'save-site-goals-settings', {
			settings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings: SiteGoalsSettings ) => settings,
	validateParams: validateSiteGoalsSettings,
	isAction: true,
} ) as {
	actions: {
		fetchSaveSiteGoalsSettings: ( settings: SiteGoalsSettings ) => unknown;
	};
};

const baseInitialState: State = {
	siteGoalsSettings: undefined,
};

const baseActions = {
	/**
	 * Saves the site goals settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} settings Partial site goals settings to save.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveSiteGoalsSettings: createValidatedAction(
		( settings: SiteGoalsSettings ) => {
			validateSiteGoalsSettings( settings );
		},
		function* (
			settings: SiteGoalsSettings
		): Generator< unknown, SaveResult, unknown > {
			yield clearActionError( 'saveSiteGoalsSettings', [] );

			const registry =
				( yield commonActions.getRegistry() ) as SiteGoalsRegistry;

			const currentSettings = ( yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getSiteGoalsSettings()
			) ) as SiteGoalsSettings | undefined;

			const { response, error } =
				( yield fetchSaveSiteGoalsSettingsStore.actions.fetchSaveSiteGoalsSettings(
					{
						...currentSettings,
						...settings,
					}
				) ) as SaveResult;

			if ( error ) {
				yield setErrorForAction( error, 'saveSiteGoalsSettings', [] );
			}

			return { response, error };
		}
	),
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
	 * Gets the site goals settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Site goals settings, or `undefined` if not loaded.
	 */
	getSiteGoalsSettings( state: State ): SiteGoalsSettings | undefined {
		return state.siteGoalsSettings?.settings;
	},

	/**
	 * Gets the selected site goals goal drivers.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return {Object|undefined} Visitor engagement selections, or `undefined` if not loaded.
	 */
	getSiteGoalsVisitorEngagement: createRegistrySelector(
		( select: Select ) => () =>
			select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings()
				?.visitorEngagement
	),

	/**
	 * Checks whether the site goals settings are currently being saved.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if the settings are being saved, otherwise `false`.
	 */
	isSavingSiteGoalsSettings( state: State ): boolean {
		return Object.values(
			state.isFetchingSaveSiteGoalsSettings || {}
		).some( Boolean );
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
