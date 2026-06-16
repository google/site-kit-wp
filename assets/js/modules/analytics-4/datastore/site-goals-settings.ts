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
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	Select,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { combineStores } from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from './constants';

export interface SiteGoalsSettings {
	activeWidgets: string[];
}

interface State {
	siteGoalsSettings?: SiteGoalsSettings;
	breakdownTooltipPending?: boolean;
}

const SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING =
	'SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING';

interface SetBreakdownTooltipPendingAction {
	type: typeof SET_SITE_GOALS_BREAKDOWN_TOOLTIP_PENDING;
	payload: { isPending: boolean };
}

// Minimal registry view for resolvers.
interface SiteGoalsRegistry {
	select: ( storeName: string ) => {
		getSiteGoalsSettings: () => SiteGoalsSettings | undefined;
	};
}

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
	reducerCallback: createReducer(
		( state: State, settings: SiteGoalsSettings ) => {
			state.siteGoalsSettings = settings;
		}
	),
} ) as {
	actions: { fetchGetSiteGoalsSettings: () => unknown };
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
	 * Marks the breakdown notice tooltip as pending, so the Side Panel parent
	 * shows it once the panel overlay closes.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * Gets the site-wide site goals settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Site-wide site goals settings, or `undefined` if not loaded.
	 */
	getSiteGoalsSettings( state: State ): SiteGoalsSettings | undefined {
		return state.siteGoalsSettings;
	},

	/**
	 * Gets the active widget categories.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} Active widget category slugs, or `undefined` if not loaded.
	 */
	getActiveWidgets( state: State ): string[] | undefined {
		return state.siteGoalsSettings?.activeWidgets;
	},

	/**
	 * Checks whether a given widget category is active.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} category Widget category slug (e.g. 'lead' or 'ecommerce').
	 * @return {boolean|undefined} `true` if active, `false` if not, `undefined` if not loaded.
	 */
	isSiteGoalWidgetActive: createRegistrySelector(
		( select: Select ) =>
			( _state: State, category: string ): boolean | undefined => {
				const settings =
					select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings();
				if ( settings === undefined ) {
					return undefined;
				}
				return settings.activeWidgets.includes( category );
			}
	),

	/**
	 * Checks whether the breakdown notice tooltip is pending (deferred from the
	 * Side Panel until it closes).
	 *
	 * @since n.e.x.t
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

const store = combineStores( fetchGetSiteGoalsSettingsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} ) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
