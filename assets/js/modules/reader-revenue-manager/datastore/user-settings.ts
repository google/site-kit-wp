/**
 * `modules/reader-revenue-manager` data store: user settings.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import { commonActions, createReducer } from 'googlesitekit-data';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import {
	combineStores,
	createValidatedAction,
} from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

const { setErrorForAction, clearActionError } = errorStoreActions;

interface UserSettings {
	lastActionedExpressSetups?: Record< string, number >;
}

interface UserSettingsState {
	userSettings: UserSettings | undefined;
}

/**
 * Validates Reader Revenue Manager user settings.
 *
 * @since n.e.x.t
 *
 * @param  settings User settings to validate.
 * @return {void}
 */
function validateUserSettings( settings: unknown ): void {
	invariant( isPlainObject( settings ), 'settings should be an object.' );

	const userSettings = settings as Record< string, unknown >;

	if ( userSettings.lastActionedExpressSetups === undefined ) {
		return;
	}

	invariant(
		isPlainObject( userSettings.lastActionedExpressSetups ),
		'lastActionedExpressSetups should be an object.'
	);

	Object.values(
		userSettings.lastActionedExpressSetups as Record< string, unknown >
	).forEach( ( timestamp ) => {
		invariant(
			Number.isInteger( timestamp ),
			'lastActionedExpressSetups timestamps should be integers.'
		);
	} );
}

const fetchStoreReducerCallback = createReducer(
	( state: UserSettingsState, settings: UserSettings ) => {
		state.userSettings = settings;
	}
);

const fetchGetUserSettingsStore = createFetchStore( {
	baseName: 'getUserSettings',
	controlCallback: () =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'user-settings',
			{},
			{
				useCache: false,
			} as Parameters< typeof get >[ 4 ]
		),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveUserSettingsStore = createFetchStore( {
	baseName: 'saveUserSettings',
	controlCallback: ( settings: UserSettings ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'user-settings',
			settings
		),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings: UserSettings ) => settings,
	validateParams: validateUserSettings,
	isAction: true,
} );

const baseInitialState: UserSettingsState = {
	userSettings: undefined,
};

const baseActions = {
	/**
	 * Saves Reader Revenue Manager user settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param  settings User settings to save.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveUserSettings: createValidatedAction(
		validateUserSettings,
		function* ( settings: UserSettings ) {
			yield clearActionError( 'saveUserSettings', [] );

			const saveResult =
				// @ts-expect-error createFetchStore is not properly typed yet.
				yield fetchSaveUserSettingsStore.actions.fetchSaveUserSettings(
					settings
				);

			const { response, error } = saveResult;

			if ( error ) {
				yield setErrorForAction( error, 'saveUserSettings', [] );
			}

			return { response, error };
		}
	),
};

const baseResolvers = {
	*getUserSettings(): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		if (
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getUserSettings() === undefined
		) {
			// @ts-expect-error createFetchStore is not properly typed yet.
			yield fetchGetUserSettingsStore.actions.fetchGetUserSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets Reader Revenue Manager user settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param  state Data store's state.
	 * @return {UserSettings|undefined} User settings, or `undefined` if not loaded.
	 */
	getUserSettings( state: UserSettingsState ): UserSettings | undefined {
		return state.userSettings;
	},
};

interface Store {
	initialState: UserSettingsState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores(
	fetchGetUserSettingsStore,
	fetchSaveUserSettingsStore,
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
