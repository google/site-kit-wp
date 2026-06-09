/**
 * `modules/analytics-4` data store: advanced data breakdowns settings.
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

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from './constants';

const { setErrorForAction, clearActionError } = errorStoreActions;

/**
 * Advanced data breakdowns settings shape.
 *
 * @since n.e.x.t
 */
export interface AdvancedDataBreakdownsSettings {
	enabled: boolean;
}

interface AdvancedDataBreakdownsState {
	advancedDataBreakdownsSettings: AdvancedDataBreakdownsSettings | undefined;
}

const SET_ADVANCED_DATA_BREAKDOWNS_ENABLED =
	'SET_ADVANCED_DATA_BREAKDOWNS_ENABLED' as const;

type Action = {
	type: typeof SET_ADVANCED_DATA_BREAKDOWNS_ENABLED;
	payload: { enabled: boolean };
};

/**
 * Checks that advanced data breakdowns settings are an object with a boolean `enabled` flag.
 *
 * @since n.e.x.t
 *
 * @param  settings Advanced data breakdowns settings to validate.
 * @return {void}
 */
function validateAdvancedDataBreakdownsSettings( settings: unknown ) {
	invariant(
		settings && typeof settings === 'object',
		'advancedDataBreakdownsSettings should be an object.'
	);
	invariant(
		typeof ( settings as { enabled?: unknown } ).enabled === 'boolean',
		'enabled should be a boolean.'
	);
}

const fetchStoreReducerCallback = createReducer(
	(
		state: AdvancedDataBreakdownsState,
		settings: AdvancedDataBreakdownsSettings
	) => {
		state.advancedDataBreakdownsSettings = settings;
	}
);

// `createFetchStore` is an untyped helper that returns a generic object, so we
// describe the one fetch action we call on each store here. The rest of the
// store shape (controls, reducer, selectors) is merged in by `combineStores`.
interface FetchGetStore {
	actions: {
		fetchGetAdvancedDataBreakdownsSettings: () => unknown;
	};
}

interface FetchSaveStore {
	actions: {
		fetchSaveAdvancedDataBreakdownsSettings: (
			settings: AdvancedDataBreakdownsSettings
		) => unknown;
	};
}

interface SaveSettingsResult {
	response: unknown;
	error: unknown;
}

const fetchGetAdvancedDataBreakdownsSettingsStore = createFetchStore( {
	baseName: 'getAdvancedDataBreakdownsSettings',
	controlCallback() {
		return get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'advanced-data-breakdowns-settings',
			{},
			// The shared `get()` helper types its options as all-required, but
			// they are optional at runtime, so cast to pass only `useCache`.
			{ useCache: false } as Parameters< typeof get >[ 4 ]
		);
	},
	reducerCallback: fetchStoreReducerCallback,
} ) as FetchGetStore;

const fetchSaveAdvancedDataBreakdownsSettingsStore = createFetchStore( {
	baseName: 'saveAdvancedDataBreakdownsSettings',
	controlCallback: ( settings: AdvancedDataBreakdownsSettings ) =>
		set(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'save-advanced-data-breakdowns-settings',
			{ settings }
		),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings: AdvancedDataBreakdownsSettings ) => settings,
	validateParams: validateAdvancedDataBreakdownsSettings,
	isAction: true,
} ) as FetchSaveStore;

const baseInitialState: AdvancedDataBreakdownsState = {
	advancedDataBreakdownsSettings: undefined,
};

const baseActions = {
	/**
	 * Sets the advanced data breakdowns enabled flag in local state.
	 *
	 * @since n.e.x.t
	 *
	 * @param enabled Whether breakdowns are enabled.
	 * @return Redux-style action.
	 */
	setAdvancedDataBreakdownsEnabled( enabled: boolean ) {
		invariant(
			typeof enabled === 'boolean',
			'enabled should be a boolean.'
		);

		return {
			type: SET_ADVANCED_DATA_BREAKDOWNS_ENABLED,
			payload: { enabled },
		};
	},

	/**
	 * Saves the advanced data breakdowns settings via the dedicated endpoint.
	 *
	 * @since n.e.x.t
	 *
	 * @return Object with `response` and `error`.
	 */
	saveAdvancedDataBreakdownsSettings: createValidatedAction(
		// The first callback validates the action's arguments. This action
		// takes none. It reads the settings from state and validates them
		// inside the generator below.
		() => {},
		function* (): Generator< unknown, SaveSettingsResult, unknown > {
			const registryResult = yield commonActions.getRegistry();
			const registry = registryResult as WPDataRegistry;
			const settings = registry
				.select( MODULES_ANALYTICS_4 )
				.getAdvancedDataBreakdownsSettings();

			validateAdvancedDataBreakdownsSettings( settings );

			yield clearActionError( 'saveAdvancedDataBreakdownsSettings', [] );

			const saveResponse =
				yield fetchSaveAdvancedDataBreakdownsSettingsStore.actions.fetchSaveAdvancedDataBreakdownsSettings(
					settings as AdvancedDataBreakdownsSettings
				);

			const { response, error } = saveResponse as SaveSettingsResult;

			if ( error ) {
				yield setErrorForAction(
					error,
					'saveAdvancedDataBreakdownsSettings',
					[]
				);
			}

			return { response, error };
		}
	),
};

const baseResolvers = {
	*getAdvancedDataBreakdownsSettings(): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;
		const settings = registry
			.select( MODULES_ANALYTICS_4 )
			.getAdvancedDataBreakdownsSettings();

		if ( settings === undefined ) {
			yield fetchGetAdvancedDataBreakdownsSettingsStore.actions.fetchGetAdvancedDataBreakdownsSettings();
		}
	},
};

const baseReducer = createReducer(
	( state: AdvancedDataBreakdownsState, { type, payload }: Action ) => {
		switch ( type ) {
			case SET_ADVANCED_DATA_BREAKDOWNS_ENABLED: {
				const { enabled } = payload;
				state.advancedDataBreakdownsSettings = {
					...state.advancedDataBreakdownsSettings,
					enabled,
				};
				break;
			}

			default:
				break;
		}
	}
);

const baseSelectors = {
	/**
	 * Gets the full advanced data breakdowns settings object.
	 *
	 * @since n.e.x.t
	 *
	 * @param state Data store's state.
	 * @return Settings object, or `undefined` while loading.
	 */
	getAdvancedDataBreakdownsSettings(
		state: AdvancedDataBreakdownsState
	): AdvancedDataBreakdownsSettings | undefined {
		return state.advancedDataBreakdownsSettings;
	},

	/**
	 * Checks whether advanced data breakdowns is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @return `true` when enabled, `false` when not, `undefined` while loading.
	 */
	isAdvancedDataBreakdownsEnabled: createRegistrySelector(
		( select: Select ) => (): boolean | undefined => {
			const settings =
				select(
					MODULES_ANALYTICS_4
				).getAdvancedDataBreakdownsSettings();

			if ( settings === undefined ) {
				return undefined;
			}

			return !! settings.enabled;
		}
	),
};

// `combineStores` is an untyped helper that returns a generic object, so we
// describe the merged store's shape and cast to it (the same approach as
// `core/pdf`). `controls` is contributed by the fetch stores, so it stays
// loosely typed here.
interface Store {
	initialState: AdvancedDataBreakdownsState;
	actions: typeof baseActions;
	controls: Record< string, unknown >;
	reducer: typeof baseReducer;
	resolvers: typeof baseResolvers;
	selectors: typeof baseSelectors;
}

const store = combineStores(
	fetchGetAdvancedDataBreakdownsSettingsStore,
	fetchSaveAdvancedDataBreakdownsSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
		selectors: baseSelectors,
		reducer: baseReducer,
	}
) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
