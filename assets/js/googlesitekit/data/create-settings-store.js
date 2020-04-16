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
import { createFetchInfrastructure } from './create-fetch-infrastructure';

const { commonActions, commonControls, createRegistrySelector } = Data;

// Actions
const SET_SETTINGS = 'SET_SETTINGS';
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
	};

	const fetchSettingsInfrastructure = createFetchInfrastructure( {
		baseName: 'getSettings',
		controlCallback: () => {
			return API.get( type, identifier, datapoint );
		},
		reducerCallback: ( state, values ) => {
			return {
				...state,
				savedSettings: {
					...values,
				},
				settings: {
					...values,
					// In case settings were already changed, they should take precedence.
					...( state.settings || {} ),
				},
			};
		},
	} );

	const fetchSaveSettingsInfrastructure = createFetchInfrastructure( {
		baseName: 'saveSettings',
		controlCallback: ( params ) => {
			const { values } = params;
			return API.set( type, identifier, datapoint, values );
		},
		reducerCallback: ( state, values ) => {
			return {
				...state,
				savedSettings: {
					...values,
				},
				settings: {
					// Ensure client settings are refreshed from server.
					...values,
				},
			};
		},
		keyParams: {
			values: ( value ) => 'object' === typeof value,
		},
	} );

	// This will be populated further down with reducer functions for individual settings.
	const settingReducers = {};

	const actions = {
		...commonActions,
		...fetchSettingsInfrastructure.actions,
		...fetchSaveSettingsInfrastructure.actions,

		/**
		 * Sets settings for the given values.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} values Settings with their values to set.
		 * @return {Object} Redux-style action.
		 */
		setSettings( values ) {
			invariant( 'object' === typeof values, 'values is required.' );

			return {
				payload: { values },
				type: SET_SETTINGS,
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
			return {
				payload: {},
				type: ROLLBACK_SETTINGS,
			};
		},

		/**
		 * Saves all current settings to the server.
		 *
		 * @since 1.6.0
		 *
		 * @return {Object} Redux-style action.
		 */
		*saveSettings() {
			const registry = yield commonActions.getRegistry();
			const values = registry.select( STORE_NAME ).getSettings();

			return yield actions.fetchSaveSettings( values );
		},
	};

	const controls = {
		...commonControls,
		...fetchSettingsInfrastructure.controls,
		...fetchSaveSettingsInfrastructure.controls,
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

				return fetchSettingsInfrastructure.reducer(
					fetchSaveSettingsInfrastructure.reducer(
						state,
						{ type, payload }
					),
					{ type, payload }
				);
			}
		}
	};

	const resolvers = {
		...fetchSettingsInfrastructure.resolvers,
		...fetchSaveSettingsInfrastructure.resolvers,

		*getSettings() {
			const registry = yield commonActions.getRegistry();
			const existingSettings = registry.select( STORE_NAME ).getSettings();
			// If settings are already present, don't fetch them.
			if ( ! existingSettings ) {
				yield actions.fetchGetSettings();
			}
		},
	};

	const selectors = {
		...fetchSettingsInfrastructure.selectors,
		...fetchSaveSettingsInfrastructure.selectors,

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
			// Since isFetchingSaveSettings (via createFetchInfrastructure)
			// holds information based on specific values but we only need
			// generic information here, we need to check whether ANY such
			// request is in progress.
			if ( 'object' !== typeof state.isFetchingSaveSettings ) {
				return false;
			}
			return Object.values( state.isFetchingSaveSettings ).some( ( value ) => value );
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
