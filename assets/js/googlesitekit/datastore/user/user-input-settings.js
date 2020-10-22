/**
 * `core/user` settings store: user input settings.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
const { commonActions, createRegistrySelector } = Data;

function fetchStoreReducerCallback( state, inputSettings ) {
	return {
		...state,
		inputSettings: Object
			.keys( inputSettings )
			.reduce( ( accum, key ) => ( { ...accum, [ key ]: inputSettings[ key ].values } ), {} ),
	};
}

const fetchGetUserInputSettingsStore = createFetchStore( {
	baseName: 'getUserInputSettings',
	controlCallback: () => API.get( 'core', 'user', 'user-input-settings', undefined, { useCache: false } ),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveUserInputSettingsStore = createFetchStore( {
	baseName: 'saveUserInputSettings',
	controlCallback: ( settings ) => API.set( 'core', 'user', 'user-input-settings', { settings } ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant( isPlainObject( settings ), 'valid settings are required.' );
	},
} );

// Actions
const SET_USER_INPUT_SETTINGS = 'SET_USER_INPUT_SETTINGS';
const SET_USER_INPUT_SETTING = 'SET_USER_INPUT_SETTING';

const baseInitialState = {
	inputSettings: undefined,
};

const baseActions = {
	/**
	 * Sets user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} values User input settings.
	 * @return {Object} Redux-style action.
	 */
	setUserInputSettings( values ) {
		return {
			type: SET_USER_INPUT_SETTINGS,
			payload: { values },
		};
	},

	/**
	 * Sets user input setting.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}         settingID Setting key.
	 * @param {Array.<string>} values    User input settings.
	 * @return {Object} Redux-style action.
	 */
	setUserInputSetting( settingID, values ) {
		return {
			type: SET_USER_INPUT_SETTING,
			payload: {
				settingID,
				values,
			},
		};
	},

	/**
	 * Saves user input settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveUserInputSettings() {
		const registry = yield Data.commonActions.getRegistry();
		const settings = registry.select( STORE_NAME ).getUserInputSettings();

		const { response, error } = yield fetchSaveUserInputSettingsStore.actions.fetchSaveUserInputSettings( settings );
		if ( error ) {
			// Store error manually since saveUserInputSettings signature differs from fetchSaveUserInputSettings.
			registry.dispatch( STORE_NAME ).receiveError( error, 'saveUserInputSettings' );
		}

		return { response, error };
	},
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_USER_INPUT_SETTINGS: {
			return {
				...state,
				inputSettings: payload.values,
			};
		}
		case SET_USER_INPUT_SETTING: {
			return {
				...state,
				inputSettings: {
					...state.inputSettings,
					[ payload.settingID ]: payload.values,
				},
			};
		}
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getUserInputSettings() {
		const { select } = yield commonActions.getRegistry();
		if ( ! select( STORE_NAME ).getUserInputSettings() ) {
			yield fetchGetUserInputSettingsStore.actions.fetchGetUserInputSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets input settings info for this user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User input settings.
	 */
	getUserInputSettings( state ) {
		const { inputSettings } = state;
		return inputSettings;
	},

	/**
	 * Gets a particular input setting.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User input settings.
	 */
	getUserInputSetting: createRegistrySelector( ( select ) => ( state, settingID ) => {
		const settings = select( STORE_NAME ).getUserInputSettings() || {};
		return settings[ settingID ] || [];
	} ),
};

const store = Data.combineStores(
	fetchGetUserInputSettingsStore,
	fetchSaveUserInputSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
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
