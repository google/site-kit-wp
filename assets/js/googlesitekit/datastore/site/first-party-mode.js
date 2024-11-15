/**
 * `core/site` data store: first-party-mode.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isPlainObject } from 'lodash';
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	commonActions,
	createRegistrySelector,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const SET_FIRST_PARTY_MODE_ENABLED = 'SET_FIRST_PARTY_MODE_ENABLED';

const settingsReducerCallback = createReducer(
	( state, firstPartyModeSettings ) => {
		state.firstPartyModeSettings = firstPartyModeSettings;
	}
);

const fetchGetFirstPartyModeSettingsStore = createFetchStore( {
	baseName: 'getFirstPartyModeSettings',
	controlCallback: () =>
		API.get( 'core', 'site', 'fpm-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveFirstPartyModeSettingsStore = createFetchStore( {
	baseName: 'saveFirstPartyModeSettings',
	controlCallback: ( { settings } ) => {
		return API.set( 'core', 'site', 'fpm-settings', { settings } );
	},
	reducerCallback: settingsReducerCallback,
	argsToParams: ( settings ) => {
		const { isEnabled } = settings || {};
		return { settings: { isEnabled } };
	},
	validateParams: ( { settings } ) => {
		invariant(
			isPlainObject( settings ),
			'settings must be a plain object.'
		);

		invariant(
			typeof settings.isEnabled === 'boolean',
			'isEnabled must be a boolean.'
		);

		invariant(
			Object.keys( settings ).length === 1,
			'settings must have only the `isEnabled` property.'
		);
	},
} );

const baseInitialState = {
	firstPartyModeSettings: undefined,
};

const baseActions = {
	/**
	 * Saves the first-party mode settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveFirstPartyModeSettings() {
		const { select } = yield commonActions.getRegistry();
		const settings = select( CORE_SITE ).getFirstPartyModeSettings();

		return yield fetchSaveFirstPartyModeSettingsStore.actions.fetchSaveFirstPartyModeSettings(
			settings
		);
	},

	/**
	 * Sets the first-party mode enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} isEnabled First-party mode enabled status.
	 * @return {Object} Redux-style action.
	 */
	setFirstPartyModeEnabled( isEnabled ) {
		return {
			type: SET_FIRST_PARTY_MODE_ENABLED,
			payload: { isEnabled },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_FIRST_PARTY_MODE_ENABLED: {
			state.firstPartyModeSettings = state.firstPartyModeSettings || {};
			state.firstPartyModeSettings.isEnabled = !! payload.isEnabled;
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getFirstPartyModeSettings() {
		const { select } = yield commonActions.getRegistry();

		const settings = select( CORE_SITE ).getFirstPartyModeSettings();

		if ( settings === undefined ) {
			yield fetchGetFirstPartyModeSettingsStore.actions.fetchGetFirstPartyModeSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the first-party mode settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} First-party mode settings, or undefined if not loaded.
	 */
	getFirstPartyModeSettings: ( state ) => {
		return state.firstPartyModeSettings;
	},

	/**
	 * Checks if first-party mode is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if first-party mode is enabled, otherwise false. Returned undefined if the state is not loaded.
	 */
	isFirstPartyModeEnabled: createRegistrySelector( ( select ) => () => {
		const { isEnabled } =
			select( CORE_SITE ).getFirstPartyModeSettings() || {};

		return isEnabled;
	} ),

	/**
	 * Checks if the FPFE service is determined to be healthy.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the FPFE service is healthy, otherwise false. Returned undefined if the state is not loaded.
	 */
	isFPMHealthy: createRegistrySelector( ( select ) => () => {
		const { isFPMHealthy } =
			select( CORE_SITE ).getFirstPartyModeSettings() || {};

		return isFPMHealthy;
	} ),

	/**
	 * Checks if the GTag proxy script is accessible.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the `fpm/measurement.php` proxy script is accessible, otherwise false. Returned undefined if the state is not loaded.
	 */
	isScriptAccessEnabled: createRegistrySelector( ( select ) => () => {
		const { isScriptAccessEnabled } =
			select( CORE_SITE ).getFirstPartyModeSettings() || {};

		return isScriptAccessEnabled;
	} ),
};

const store = combineStores(
	fetchGetFirstPartyModeSettingsStore,
	fetchSaveFirstPartyModeSettingsStore,
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
