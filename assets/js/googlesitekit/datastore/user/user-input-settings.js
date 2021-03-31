/**
 * `core/user` settings store: user input settings.
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
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { deleteItem, getItem, setItem } from '../../../googlesitekit/api/cache';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { actions as errorStoreActions } from '../../data/create-error-store';
const { commonActions, createRegistryControl, createRegistrySelector } = Data;
const { receiveError, clearError } = errorStoreActions;

const CACHE_KEY_NAME = 'userInputSettings';

function fetchStoreReducerCallback( state, inputSettings ) {
	return { ...state, inputSettings };
}

const fetchGetUserInputSettingsStore = createFetchStore( {
	baseName: 'getUserInputSettings',
	controlCallback: async () => API.get( 'core', 'user', 'user-input-settings', undefined, { useCache: false } ),
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
const DELETE_CACHED_USER_INPUT_SETTINGS = 'DELETE_CACHED_USER_INPUT_SETTINGS';
const GET_CACHED_USER_INPUT_SETTINGS = 'GET_CACHED_USER_INPUT_SETTINGS';
const SET_CACHED_USER_INPUT_SETTING = 'SET_CACHED_USER_INPUT_SETTING';
const SET_USER_INPUT_SETTING = 'SET_USER_INPUT_SETTING';
const SET_USER_INPUT_SETTINGS_SAVING_FLAG = 'SET_USER_INPUT_SETTINGS_SAVING_FLAG';

const baseInitialState = {
	inputSettings: undefined,
	isSavingInputSettings: false,
};

const baseActions = {
	/**
	 * Gets cached user input settings and save them to the data store.
	 *
	 * @since 1.29.0
	 * @private
	 *
	 * @return {Object} Cached user input answer values.
	 */
	*setUserInputSettingsFromCache() {
		const cachedValues = yield {
			type: GET_CACHED_USER_INPUT_SETTINGS,
			payload: {},
		};

		if ( cachedValues.cacheHit ) {
			for ( const key of Object.keys( cachedValues.value ) ) {
				yield baseActions.setUserInputSetting( key, cachedValues.value[ key ].values );
			}
		}

		return cachedValues.cacheHit ? cachedValues.value : {};
	},

	/**
	 * Sets user input setting.
	 *
	 * @since 1.19.0 Function introduced.
	 * @since 1.29.0 Action is now an async action that caches answers.
	 *
	 * @param {string}         settingID Setting key.
	 * @param {Array.<string>} values    User input settings.
	 * @return {Object} Redux-style action.
	 */
	*setUserInputSetting( settingID, values ) {
		const registry = yield Data.commonActions.getRegistry();

		const trimmedValues = values.map( ( value ) => value.trim() );
		if ( registry.select( STORE_NAME ).getUserInputState() !== 'completed' ) {
			// Save this setting in the cache.
			yield {
				type: SET_CACHED_USER_INPUT_SETTING,
				payload: {
					settingID,
					values: trimmedValues,
				},
			};
		}

		return {
			type: SET_USER_INPUT_SETTING,
			payload: {
				settingID,
				values: trimmedValues,
			},
		};
	},

	/**
	 * Saves user input settings.
	 *
	 * @since 1.19.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveUserInputSettings() {
		const registry = yield Data.commonActions.getRegistry();
		yield clearError( 'saveUserInputSettings', [] );

		const trim = ( value ) => value.trim();
		const notEmpty = ( value ) => value.length > 0;

		const settings = registry.select( STORE_NAME ).getUserInputSettings();
		const values = Object.keys( settings ).reduce( ( accum, key ) => ( {
			...accum,
			[ key ]: ( settings[ key ]?.values || [] ).map( trim ).filter( notEmpty ),
		} ), {} );

		yield {
			type: SET_USER_INPUT_SETTINGS_SAVING_FLAG,
			payload: { isSaving: true },
		};

		const { response, error } = yield fetchSaveUserInputSettingsStore.actions.fetchSaveUserInputSettings( values );
		if ( error ) {
			// Store error manually since saveUserInputSettings signature differs from fetchSaveUserInputSettings.
			yield receiveError( error, 'saveUserInputSettings', [] );
		}

		yield {
			type: DELETE_CACHED_USER_INPUT_SETTINGS,
			payload: {},
		};

		yield {
			type: SET_USER_INPUT_SETTINGS_SAVING_FLAG,
			payload: { isSaving: false },
		};

		return { response, error };
	},
};

export const baseControls = {
	[ DELETE_CACHED_USER_INPUT_SETTINGS ]: () => {
		return deleteItem( CACHE_KEY_NAME );
	},
	[ GET_CACHED_USER_INPUT_SETTINGS ]: () => {
		return getItem( CACHE_KEY_NAME );
	},
	[ SET_CACHED_USER_INPUT_SETTING ]: createRegistryControl( ( registry ) => async ( { payload: { settingID, values } } ) => {
		const settings = registry.select( STORE_NAME ).getUserInputSettings() || {};

		settings[ settingID ] = { values };

		return setItem( CACHE_KEY_NAME, settings );
	} ),
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_USER_INPUT_SETTING: {
			return {
				...state,
				inputSettings: {
					...state.inputSettings,
					[ payload.settingID ]: {
						...( ( state.inputSettings || {} )[ payload.settingID ] || {} ),
						values: payload.values,
					},
				},
			};
		}
		case SET_USER_INPUT_SETTINGS_SAVING_FLAG: {
			return {
				...state,
				isSavingInputSettings: payload.isSaving,
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

		if ( select( STORE_NAME ).getUserInputState() !== 'completed' ) {
			yield baseActions.setUserInputSettingsFromCache();
		}
	},
};

const baseSelectors = {
	/**
	 * Determines whether the user input settings are being saved or not.
	 *
	 * @since 1.25.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the user input settings are being saved, otherwise FALSE.
	 */
	isSavingUserInputSettings( state ) {
		return !! state?.isSavingInputSettings;
	},

	/**
	 * Gets input settings info for this user.
	 *
	 * @since 1.19.0
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
	 * @since 1.19.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<string>|undefined)} User input setting values.
	 */
	getUserInputSetting: createRegistrySelector( ( select ) => ( state, settingID ) => {
		const settings = select( STORE_NAME ).getUserInputSettings() || {};
		const values = settings[ settingID ]?.values;
		return Array.isArray( values ) ? values : [];
	} ),

	/**
	 * Gets a scope of the input setting.
	 *
	 * @since 1.20.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} User input setting scope.
	 */
	getUserInputSettingScope: createRegistrySelector( ( select ) => ( state, settingID ) => {
		const settings = select( STORE_NAME ).getUserInputSettings() || {};
		return settings[ settingID ]?.scope;
	} ),

	/**
	 * Gets an author of the input setting.
	 *
	 * @since 1.20.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User input setting author.
	 */
	getUserInputSettingAuthor: createRegistrySelector( ( select ) => ( state, settingID ) => {
		const settings = select( STORE_NAME ).getUserInputSettings() || {};
		return settings[ settingID ]?.author;
	} ),
};

const store = Data.combineStores(
	fetchGetUserInputSettingsStore,
	fetchSaveUserInputSettingsStore,
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
