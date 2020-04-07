/**
 * Provides API functions to create a datastore for settings.
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
import { isEqual } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';

const { commonActions, commonControls, createRegistrySelector } = Data;
const { getRegistry } = commonActions;

// Actions
const SET_SETTINGS = 'SET_SETTINGS';
const FETCH_SETTINGS = 'FETCH_SETTINGS';
const FETCH_SETTINGS_STARTED = 'FETCH_SETTINGS_STARTED';
const FETCH_SAVE_SETTINGS = 'FETCH_SAVE_SETTINGS';
const FETCH_SAVE_SETTINGS_STARTED = 'FETCH_SAVE_SETTINGS_STARTED';
const RECEIVE_SETTINGS = 'RECEIVE_SETTINGS';
const RECEIVE_SETTINGS_FAILED = 'RECEIVE_SETTINGS_FAILED';
const RECEIVE_SAVE_SETTINGS = 'RECEIVE_SAVE_SETTINGS';
const RECEIVE_SAVE_SETTINGS_FAILED = 'RECEIVE_SAVE_SETTINGS_FAILED';
const ROLLBACK_SETTINGS = 'ROLLBACK_SETTINGS';

/**
 * Creates a store object that includes actions and selectors for managing settings.
 *
 * The first three parameters hook up the store to the respective REST API endpoint,
 * while the fourth defines the names of the sub-settings to support.
 *
 * @since 1.6.0
 * @private
 * @param {string} type                 The data to access. One of 'core' or 'modules'.
 * @param {string} identifier           The data identifier, eg. a module slug like 'search-console'.
 * @param {string} datapoint            The endpoint to request data from, e.g. 'settings'.
 * @param {Object} options              Optional. Options to consider for the store.
 * @param {number} options.storeName    Store name to use. Default is '{type}/{identifier}'.
 * @param {Array}  options.settingSlugs List of the slugs that are part of the settings object
 *                                      handled by the respective API endpoint.
 * @return {Object} The settings store object, with additional `STORE_NAME` and
 *                  `INITIAL_STATE` properties.
 */
export const createSettingsStore = ( type, identifier, datapoint, {
	storeName = undefined,
	settingSlugs = [],
} = {} ) => {
	invariant( type, 'type is required.' );
	invariant( identifier, 'identifier is required.' );
	invariant( datapoint, 'datapoint is required.' );

	const STORE_NAME = storeName || `${ type }/${ identifier }`;

	const INITIAL_STATE = {
		settings: undefined,
		savedSettings: undefined,
		isFetchingSettings: false,
		isFetchingSaveSettings: false,
	};

	// This will be populated further down with reducer functions for individual settings.
	const settingReducers = {};

	const actions = {
		...commonActions,

		/**
		 * Sets settings for the given values.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} values Settings with their values to set.
		 * @return {Object} Redux-style action.
		 */
		setSettings( values ) {
			invariant( values, 'values is required.' );

			return {
				payload: { values },
				type: SET_SETTINGS,
			};
		},

		/**
		 * Dispatches an action that creates an HTTP request to the settings endpoint.
		 *
		 * @since 1.6.0
		 * @private
		 *
		 * @return {Object} Redux-style action.
		 */
		*fetchSettings() {
			yield {
				payload: {},
				type: FETCH_SETTINGS_STARTED,
			};

			return {
				payload: {},
				type: FETCH_SETTINGS,
			};
		},

		/**
		 * Stores settings received from the REST API.
		 *
		 * @since 1.6.0
		 * @private
		 *
		 * @param {Array} values Settings with their values from the API.
		 * @return {Object} Redux-style action.
		 */
		receiveSettings( values ) {
			invariant( values, 'values is required.' );

			return {
				payload: { values },
				type: RECEIVE_SETTINGS,
			};
		},

		/**
		 * Dispatches an action signifying the `fetchSettings` side-effect failed.
		 *
		 * @since 1.6.0
		 * @private
		 *
		 * @return {Object} Redux-style action.
		 */
		receiveSettingsFailed() {
			return {
				payload: {},
				type: RECEIVE_SETTINGS_FAILED,
			};
		},

		/**
		 * Returns the current settings back to the current saved values.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @return {Object} Redux-style action.
		 */
		rollbackSettings() {
			return { type: ROLLBACK_SETTINGS };
		},

		/**
		 * Saves all current settings to the server.
		 *
		 * @since 1.6.0
		 *
		 * @return {Object} Redux-style action.
		 */
		*saveSettings() {
			const registry = yield getRegistry();
			const values = registry.select( STORE_NAME ).getSettings();

			try {
				const savedValues = yield actions.fetchSaveSettings( values );

				return actions.receiveSaveSettings( savedValues );
			} catch ( error ) {
				// TODO: Implement an error handler store or some kind of centralized
				// place for error dispatch...
				return actions.receiveSaveSettingsFailed( { error } );
			}
		},

		/**
		 * Dispatches an action that creates an HTTP request to save settings.
		 *
		 * @since 1.6.0
		 * @private
		 *
		 * @param {Object} values Settings with their values to save.
		 * @return {Object} Redux-style action.
		 */
		*fetchSaveSettings( values ) {
			invariant( values, 'values is required.' );

			yield {
				payload: { values },
				type: FETCH_SAVE_SETTINGS_STARTED,
			};

			return {
				payload: { values },
				type: FETCH_SAVE_SETTINGS,
			};
		},

		/**
		 * Dispatches that settings were saved via the REST API.
		 *
		 * @since 1.6.0
		 * @private
		 *
		 * @param {Array} values Settings with their values from the API.
		 * @return {Object} Redux-style action.
		 */
		receiveSaveSettings( values ) {
			invariant( values, 'values is required.' );

			return {
				payload: { values },
				type: RECEIVE_SAVE_SETTINGS,
			};
		},

		/**
		 * Dispatches an action signifying the `fetchSaveSettings` side-effect failed.
		 *
		 * @since 1.6.0
		 * @private
		 *
		 * @param {Object} args       Argument params.
		 * @param {Object} args.error Error object.
		 * @return {Object} Redux-style action.
		 */
		receiveSaveSettingsFailed( { error } ) {
			return {
				payload: { error },
				type: RECEIVE_SAVE_SETTINGS_FAILED,
			};
		},
	};

	const controls = {
		...commonControls,
		[ FETCH_SETTINGS ]: () => {
			return API.get( type, identifier, datapoint );
		},
		[ FETCH_SAVE_SETTINGS ]: ( { payload } ) => {
			const { values } = payload;
			return API.set( type, identifier, datapoint, values );
		},
	};

	const reducer = ( state = INITIAL_STATE, { type, payload } ) => { // eslint-disable-line no-shadow
		switch ( type ) {
			case SET_SETTINGS: {
				const { values } = payload;

				return {
					...state,
					settings: {
						...( state.settings || {} ),
						...values,
					},
				};
			}

			case FETCH_SETTINGS_STARTED: {
				return {
					...state,
					isFetchingSettings: true,
				};
			}

			case RECEIVE_SETTINGS: {
				const { values } = payload;

				return {
					...state,
					isFetchingSettings: false,
					savedSettings: {
						...values,
					},
					settings: {
						...values,
						// In case settings were already changed, they should take precedence.
						...( state.settings || {} ),
					},
				};
			}

			case RECEIVE_SETTINGS_FAILED: {
				return {
					...state,
					isFetchingSettings: false,
				};
			}

			case FETCH_SAVE_SETTINGS_STARTED: {
				return {
					...state,
					isFetchingSaveSettings: true,
				};
			}

			case RECEIVE_SAVE_SETTINGS: {
				const { values } = payload;

				return {
					...state,
					isFetchingSaveSettings: false,
					savedSettings: {
						...values,
					},
					settings: {
						...values,
					},
				};
			}

			case RECEIVE_SAVE_SETTINGS_FAILED: {
				return {
					...state,
					isFetchingSaveSettings: false,
				};
			}

			case ROLLBACK_SETTINGS: {
				return {
					...state,
					settings: state.savedSettings,
				};
			}

			default: {
				// Check if this action is for a reducer for an individual setting.
				if ( 'undefined' !== typeof settingReducers[ type ] ) {
					return settingReducers[ type ]( state, { type, payload } );
				}

				return { ...state };
			}
		}
	};

	const resolvers = {
		*getSettings() {
			const registry = yield getRegistry();
			const existingSettings = registry.select( STORE_NAME ).getSettings();
			// If settings are already present, don't fetch them.
			if ( existingSettings ) {
				return;
			}

			try {
				const values = yield actions.fetchSettings();
				return actions.receiveSettings( values );
			} catch ( err ) {
				return actions.receiveSettingsFailed();
			}
		},

		*getSavedSettings() {
			const registry = yield getRegistry();
			const existingSettings = registry.select( STORE_NAME ).getSavedSettings();

			if ( ! existingSettings ) {
				registry.select( STORE_NAME ).getSettings();
			}
		},
	};

	const selectors = {
		/**
		 * Gets the current settings.
		 *
		 * Returns `undefined` if notifications are not available/loaded.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {?Object} Settings with their values, or undefined.
		 */
		getSettings( state ) {
			return state.settings;
		},

		/**
		 * Gets the current saved settings.
		 *
		 * Returns `undefined` if notifications are not available/loaded.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Object} state Data store's state.
		 * @return {?Object} Settings with their values, or undefined.
		 */
		getSavedSettings( state ) {
			return state.savedSettings;
		},

		/**
		 * Indicates whether the current settings have changed from what is saved.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean} True if the settings have changed, false otherwise.
		 */
		haveSettingsChanged( state ) {
			const { settings, savedSettings } = state;

			return ! isEqual( settings, savedSettings );
		},

		/**
		 * Indicates whether saving the settings is currently in progress.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean} True if the settings are being saved, false otherwise.
		 */
		isDoingSaveSettings( state ) {
			return state.isFetchingSaveSettings;
		},
	};

	// Define individual actions, selectors and related for sub-settings.
	settingSlugs.forEach( ( slug ) => {
		const pascalCaseSlug = slug.charAt( 0 ).toUpperCase() + slug.slice( 1 );
		const constantSlug = slug.replace( /([a-z0-9]{1})([A-Z]{1})/g, '$1_$2' ).toUpperCase();

		/**
		 * Sets the setting indicated by the action name to the given value.
		 *
		 * @since 1.6.0
		 *
		 * @param {*} value Value for the setting.
		 * @return {Object} Redux-style action.
		 */
		actions[ `set${ pascalCaseSlug }` ] = ( value ) => {
			invariant( typeof value !== 'undefined', 'value is required.' );

			return {
				payload: { value },
				type: `SET_${ constantSlug }`,
			};
		};

		settingReducers[ `SET_${ constantSlug }` ] = ( state, { payload } ) => {
			const { value } = payload;

			return {
				...state,
				settings: {
					...( state.settings || {} ),
					[ slug ]: value,
				},
			};
		};

		/**
		 * Gets the current value for the setting indicated by the selector name.
		 *
		 * @since 1.6.0
		 *
		 * @return {*} Setting value, or undefined.
		 */
		selectors[ `get${ pascalCaseSlug }` ] = createRegistrySelector( ( select ) => () => {
			const settings = select( STORE_NAME ).getSettings() || {};

			return settings[ slug ];
		} );

		/**
		 * Gets the saved value for the setting indicated by the selector name.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @return {*} Setting value, or undefined.
		 */
		selectors[ `getSaved${ pascalCaseSlug }` ] = createRegistrySelector( ( select ) => () => {
			const settings = select( STORE_NAME ).getSavedSettings() || {};

			return settings[ slug ];
		} );
	} );

	return {
		STORE_NAME,
		INITIAL_STATE,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
};
