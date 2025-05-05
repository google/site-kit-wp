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
import { isPlainObject, isEqual, pick } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	commonActions,
	createRegistrySelector,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { actions as errorStoreActions } from '../../data/create-error-store';
const { receiveError, clearError } = errorStoreActions;

function fetchStoreReducerCallback( state, inputSettings ) {
	return { ...state, inputSettings, savedInputSettings: inputSettings };
}

const fetchGetUserInputSettingsStore = createFetchStore( {
	baseName: 'getUserInputSettings',
	controlCallback: () =>
		get( 'core', 'user', 'user-input-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveUserInputSettingsStore = createFetchStore( {
	baseName: 'saveUserInputSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'user', 'user-input-settings', { settings } ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant( isPlainObject( settings ), 'valid settings are required.' );
	},
} );

// Actions
const SET_USER_INPUT_SETTING = 'SET_USER_INPUT_SETTING';
const SET_USER_INPUT_SETTINGS_SAVING_FLAG =
	'SET_USER_INPUT_SETTINGS_SAVING_FLAG';
const RESET_USER_INPUT_SETTINGS = 'RESET_USER_INPUT_SETTINGS';

const baseInitialState = {
	inputSettings: undefined,
	isSavingInputSettings: false,
	savedInputSettings: undefined,
};

const baseActions = {
	/**
	 * Sets user input setting.
	 *
	 * @since 1.19.0 Function introduced.
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
				values: values.map( ( value ) => value.trim() ),
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
		const registry = yield commonActions.getRegistry();
		yield clearError( 'saveUserInputSettings', [] );

		const trim = ( value ) => value.trim();
		const notEmpty = ( value ) => value.length > 0;

		const settings = registry.select( CORE_USER ).getUserInputSettings();
		const values = Object.keys( settings ).reduce(
			( accum, key ) => ( {
				...accum,
				[ key ]: ( settings[ key ]?.values || [] )
					.map( trim )
					.filter( notEmpty ),
			} ),
			{}
		);

		yield {
			type: SET_USER_INPUT_SETTINGS_SAVING_FLAG,
			payload: { isSaving: true },
		};

		const { response, error } =
			yield fetchSaveUserInputSettingsStore.actions.fetchSaveUserInputSettings(
				values
			);
		if ( error ) {
			// Store error manually since saveUserInputSettings signature differs from fetchSaveUserInputSettings.
			yield receiveError( error, 'saveUserInputSettings', [] );
		}

		if ( ! error ) {
			yield baseActions.maybeTriggerUserInputSurvey();
		}

		yield {
			type: SET_USER_INPUT_SETTINGS_SAVING_FLAG,
			payload: { isSaving: false },
		};

		return { response, error };
	},

	/**
	 * Resets modified user input settings to currently saved values.
	 *
	 * @since 1.93.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetUserInputSettings() {
		return {
			type: RESET_USER_INPUT_SETTINGS,
			payload: {},
		};
	},

	/**
	 * Triggers user input survey if any of the answers is "Other".
	 *
	 * @since 1.104.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*maybeTriggerUserInputSurvey() {
		const { resolveSelect, dispatch } = yield commonActions.getRegistry();

		const settings = yield commonActions.await(
			resolveSelect( CORE_USER ).getUserInputSettings()
		);

		const settingsAnsweredOther = Object.keys( settings ).filter( ( key ) =>
			settings[ key ].values.includes( 'other' )
		);

		if ( ! settingsAnsweredOther.length > 0 ) {
			return;
		}

		const triggerID = `userInput_answered_other__${ settingsAnsweredOther.join(
			'_'
		) }`;

		const { response, error } = yield commonActions.await(
			dispatch( CORE_USER ).triggerSurvey( triggerID )
		);

		return { response, error };
	},
};

export const baseReducer = createReducer( ( state, action ) => {
	const { type, payload } = action;

	switch ( type ) {
		case SET_USER_INPUT_SETTING: {
			state.inputSettings = state.inputSettings || {};

			if ( ! state.inputSettings[ payload.settingID ] ) {
				state.inputSettings[ payload.settingID ] = {};
			}

			state.inputSettings[ payload.settingID ].values = payload.values;
			break;
		}

		case SET_USER_INPUT_SETTINGS_SAVING_FLAG: {
			state.isSavingInputSettings = payload.isSaving;
			break;
		}

		case RESET_USER_INPUT_SETTINGS: {
			state.inputSettings = state.savedInputSettings;
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getUserInputSettings() {
		const { select } = yield commonActions.getRegistry();

		if ( ! select( CORE_USER ).getUserInputSettings() ) {
			yield fetchGetUserInputSettingsStore.actions.fetchGetUserInputSettings();
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
	 * Gets saved input settings info for this user.
	 *
	 * @since 1.141.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Saved user input settings.
	 */
	getSavedUserInputSettings( state ) {
		const { savedInputSettings } = state;
		return savedInputSettings;
	},

	/**
	 * Gets a particular input setting.
	 *
	 * @since 1.19.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<string>|undefined)} User input setting values.
	 */
	getUserInputSetting: createRegistrySelector(
		( select ) => ( state, settingID ) => {
			const settings = select( CORE_USER ).getUserInputSettings() || {};
			const values = settings[ settingID ]?.values;
			return Array.isArray( values ) ? values : [];
		}
	),

	/**
	 * Gets a scope of the input setting.
	 *
	 * @since 1.20.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} User input setting scope.
	 */
	getUserInputSettingScope: createRegistrySelector(
		( select ) => ( state, settingID ) => {
			const settings = select( CORE_USER ).getUserInputSettings() || {};
			return settings[ settingID ]?.scope;
		}
	),

	/**
	 * Gets an author of the input setting.
	 *
	 * @since 1.20.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User input setting author.
	 */
	getUserInputSettingAuthor: createRegistrySelector(
		( select ) => ( state, settingID ) => {
			const settings = select( CORE_USER ).getUserInputSettings() || {};
			return settings[ settingID ]?.author;
		}
	),

	/**
	 * Indicates whether the current user input settings have changed from what is saved.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object}     state Data store's state.
	 * @param {Array|null} keys  Settings keys to check; if not provided, all settings are checked.
	 * @return {boolean} True if the settings have changed, false otherwise.
	 */
	haveUserInputSettingsChanged( state, keys = null ) {
		const { inputSettings, savedInputSettings } = state;

		if ( keys ) {
			return ! isEqual(
				pick( inputSettings, keys ),
				pick( savedInputSettings, keys )
			);
		}

		return ! isEqual( inputSettings, savedInputSettings );
	},

	/**
	 * Indicates whether the provided user input setting has changed from what is saved.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} state   Data store's state.
	 * @param {string} setting The setting we want to check for saved changes.
	 * @return {boolean} True if the settings have changed, false otherwise.
	 */
	hasUserInputSettingChanged( state, setting ) {
		invariant( setting, 'setting is required.' );

		return baseSelectors.haveUserInputSettingsChanged( state, [ setting ] );
	},
};

const store = combineStores(
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
