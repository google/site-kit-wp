/**
 * `core/site` data store: settings.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	commonActions,
	createRegistrySelector,
	combineStores,
} from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const fetchGetAdminBarSettingsStore = createFetchStore( {
	baseName: 'getAdminBarSettings',
	controlCallback: () =>
		API.get( 'core', 'site', 'admin-bar-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: ( state, adminBarSettings ) => {
		return {
			...state,
			adminBarSettings: {
				...( state.adminBarSettings || {} ),
				...adminBarSettings,
			},
		};
	},
} );

const fetchSetAdminBarSettingsStore = createFetchStore( {
	baseName: 'setAdminBarSettings',
	controlCallback: ( { enabled } ) =>
		API.set( 'core', 'site', 'admin-bar-settings', { enabled } ),
	reducerCallback: ( state, adminBarSettings ) => {
		return {
			...state,
			adminBarSettings: {
				...( state.adminBarSettings || {} ),
				...adminBarSettings,
			},
		};
	},
	argsToParams( { enabled } ) {
		return { enabled };
	},
	validateParams( { enabled } ) {
		invariant(
			typeof enabled === 'boolean',
			'enabled must be of boolean type'
		);
	},
} );

const baseInitialState = {
	adminBarSettings: undefined,
};

const baseActions = {
	/**
	 * Sets showAdminBar setting.
	 *
	 * @since 1.39.0
	 *
	 * @param {boolean} enabled Whether to show or hide the admin bar.
	 * @return {Object} Object with `response` and `error`.
	 */
	*setShowAdminBar( enabled ) {
		const { response, error } =
			yield fetchSetAdminBarSettingsStore.actions.fetchSetAdminBarSettings(
				{ enabled }
			);
		return { response, error };
	},
};

const baseControls = {};

function baseReducer( state, { type } ) {
	switch ( type ) {
		default:
			return state;
	}
}

const baseResolvers = {
	*getAdminBarSettings() {
		const { select } = yield commonActions.getRegistry();

		const settings = select( CORE_SITE ).getAdminBarSettings();
		if ( settings === undefined ) {
			yield fetchGetAdminBarSettingsStore.actions.fetchGetAdminBarSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets admin bar settings.
	 *
	 * @since 1.39.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Admin bar setting if they have been already resolved, otherwise undefined.
	 */
	getAdminBarSettings( state ) {
		return state.adminBarSettings;
	},

	/**
	 * Gets showAdminBar setting.
	 *
	 * @since 1.39.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} The showAdminBar setting if it has been already resolved, otherwise undefined.
	 */
	getShowAdminBar: createRegistrySelector( ( select ) => () => {
		return select( CORE_SITE ).getAdminBarSettings()?.enabled;
	} ),
};

const store = combineStores(
	fetchGetAdminBarSettingsStore,
	fetchSetAdminBarSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
