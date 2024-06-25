/**
 * Provides API functions to create a datastore for settings.
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
import API from 'googlesitekit-api';
import {
	commonActions,
	createRegistrySelector,
	commonStore,
	combineStores,
} from 'googlesitekit-data';
import { createStrictSelect } from './utils';
import {
	camelCaseToPascalCase,
	camelCaseToConstantCase,
} from './transform-case';
import { createFetchStore } from './create-fetch-store';
import { actions as errorStoreActions } from '../data/create-error-store';

// Get access to error store action creators.
// If the parent store doesn't include the error store,
// yielded error actions will be a no-op.
const { clearError, receiveError } = errorStoreActions;

// Invariant error messages.
export const INVARIANT_DOING_SUBMIT_CHANGES =
	'cannot submit changes while submitting changes';
export const INVARIANT_SETTINGS_NOT_CHANGED =
	'cannot submit changes if settings have not changed';

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
 * @since 1.129.0 Added haveSettingsChanged optional paramter.
 * @private
 *
 * @param {string}        type                                  The data to access. One of 'core' or 'modules'.
 * @param {string}        identifier                            The data identifier, eg. a module slug like 'search-console'.
 * @param {string}        datapoint                             The endpoint to request data from, e.g. 'settings'.
 * @param {Object}        options                               Optional. Options to consider for the store.
 * @param {Array}         [options.ownedSettingsSlugs]          Optional. List of "owned settings" for this module, if they exist.
 * @param {number}        [options.storeName]                   Store name to use. Default is '{type}/{identifier}'.
 * @param {Array}         [options.settingSlugs]                List of the slugs that are part of the settings object handled by the respective API endpoint.
 * @param {Object}        [options.initialSettings]             Optional. An initial set of settings as key-value pairs.
 * @param {Function|null} [options.validateHaveSettingsChanged] Optional. Custom callback to determine if settings have changed.
 * @return {Object} The settings store object, with additional `STORE_NAME` and
 *                  `initialState` properties.
 */
export const createSettingsStore = (
	type,
	identifier,
	datapoint,
	{
		ownedSettingsSlugs = undefined,
		storeName = undefined,
		settingSlugs = [],
		initialSettings = undefined,
		validateHaveSettingsChanged = makeDefaultHaveSettingsChanged(),
	} = {}
) => {
	invariant( type, 'type is required.' );
	invariant( identifier, 'identifier is required.' );
	invariant( datapoint, 'datapoint is required.' );

	const STORE_NAME = storeName || `${ type }/${ identifier }`;

	const initialState = {
		ownedSettingsSlugs,
		settings: initialSettings,
		savedSettings: undefined,
	};

	const fetchGetSettingsStore = createFetchStore( {
		baseName: 'getSettings',
		controlCallback: () => {
			return API.get(
				type,
				identifier,
				datapoint,
				{},
				{
					useCache: false,
				}
			);
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

	const fetchSaveSettingsStore = createFetchStore( {
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
		argsToParams: ( values ) => {
			return {
				values,
			};
		},
		validateParams: ( { values } = {} ) => {
			invariant( isPlainObject( values ), 'values is required.' );
		},
	} );

	// This will be populated further down with reducer functions for individual settings.
	const settingReducers = {};

	const actions = {
		/**
		 * Sets settings for the given values.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} values Settings with their values to set.
		 * @return {Object} Redux-style action.
		 */
		setSettings( values ) {
			invariant( isPlainObject( values ), 'values is required.' );

			return {
				payload: { values },
				type: SET_SETTINGS,
			};
		},

		/**
		 * Returns the current settings back to the current saved values.
		 *
		 * @since 1.7.1
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
		 * @return {Object} Response and error, if any.
		 */
		*saveSettings() {
			const registry = yield commonActions.getRegistry();

			yield clearError( 'saveSettings', [] );

			const values = registry.select( STORE_NAME ).getSettings();
			const { response, error } =
				yield fetchSaveSettingsStore.actions.fetchSaveSettings(
					values
				);
			if ( error ) {
				// Store error manually since saveSettings signature differs from fetchSaveSettings.
				yield receiveError( error, 'saveSettings', [] );
			}

			return { response, error };
		},
	};

	const controls = {};

	// eslint-disable-next-line no-shadow
	const reducer = ( state = initialState, { type, payload } ) => {
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

				return state;
			}
		}
	};

	const resolvers = {
		*getSettings() {
			const registry = yield commonActions.getRegistry();
			const existingSettings = registry
				.select( STORE_NAME )
				.getSettings();
			// If settings are already present, don't fetch them.
			if ( ! existingSettings ) {
				yield fetchGetSettingsStore.actions.fetchGetSettings();
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
		 * @return {(Object|undefined)} Settings with their values, or undefined.
		 */
		getSettings( state ) {
			return state.settings;
		},

		/**
		 * Indicates whether the current settings have changed from what is saved.
		 *
		 * @since 1.6.0
		 * @since 1.77.0 Added ability to filter settings using `keys` argument.
		 * @since 1.129.0 Changed the approach to use validateHaveSettingsChanged callback.
		 *
		 * @param {Object}     state Data store's state.
		 * @param {Array|null} keys  Settings keys to check; if not provided, all settings are checked.
		 * @return {boolean} True if the settings have changed, false otherwise.
		 */
		haveSettingsChanged: createRegistrySelector(
			( select ) =>
				( state, ...args ) =>
					validateHaveSettingsChanged( select, state, ...args )
		),

		/**
		 * Indicates whether the provided setting has changed from what is saved.
		 *
		 * @since 1.72.0
		 *
		 * @param {Object} state   Data store's state.
		 * @param {string} setting The setting we want to check for saved changes.
		 * @return {boolean} True if the settings have changed, false otherwise.
		 */
		hasSettingChanged( state, setting ) {
			invariant( setting, 'setting is required.' );

			const { settings, savedSettings } = state;

			if ( ! settings || ! savedSettings ) {
				return false;
			}

			return ! isEqual( settings[ setting ], savedSettings[ setting ] );
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
			// Since isFetchingSaveSettings (via createFetchStore)
			// holds information based on specific values but we only need
			// generic information here, we need to check whether ANY such
			// request is in progress.
			return Object.values( state.isFetchingSaveSettings ).some(
				Boolean
			);
		},

		/**
		 * Gets the owned settings slugs for this module.
		 *
		 * @since 1.77.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {Array|null} The array of owned settings slugs for this module if they exist. Returns `null` if no owned settings slugs exist.
		 */
		getOwnedSettingsSlugs: ( state ) => {
			return state.ownedSettingsSlugs;
		},

		/**
		 * Returns `true` if a module's "own settings" have changed; `false` if not.
		 *
		 * @since 1.77.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean} `true` if the module's "own settings" have changed; `false` if not.
		 */
		haveOwnedSettingsChanged: createRegistrySelector( ( select ) => () => {
			const ownedSettingsSlugsToCheck =
				select( STORE_NAME ).getOwnedSettingsSlugs();

			return select( STORE_NAME ).haveSettingsChanged(
				ownedSettingsSlugsToCheck
			);
		} ),
	};

	// Define individual actions, selectors and related for sub-settings.
	settingSlugs.forEach( ( slug ) => {
		const pascalCaseSlug = camelCaseToPascalCase( slug );
		const constantSlug = camelCaseToConstantCase( slug );

		/**
		 * Sets the setting indicated by the action name to the given value.
		 *
		 * @since 1.6.0
		 *
		 * @param {*} value Value for the setting.
		 * @return {Object} Redux-style action.
		 */
		actions[ `set${ pascalCaseSlug }` ] = ( value ) => {
			invariant(
				typeof value !== 'undefined',
				`value is required for calls to set${ pascalCaseSlug }().`
			);

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
		selectors[ `get${ pascalCaseSlug }` ] = createRegistrySelector(
			( select ) => () => {
				const settings = select( STORE_NAME ).getSettings() || {};

				return settings[ slug ];
			}
		);
	} );

	const store = combineStores(
		commonStore,
		fetchGetSettingsStore,
		fetchSaveSettingsStore,
		{
			initialState,
			actions,
			controls,
			reducer,
			resolvers,
			selectors,
		}
	);
	return {
		...store,
		STORE_NAME,
	};
};

/**
 * Creates a default submitChanges control function.
 *
 * @since 1.21.0
 *
 * @param {string} slug      Module slug.
 * @param {string} storeName Datastore slug.
 * @return {Function} Control function to submit changes.
 */
export function makeDefaultSubmitChanges( slug, storeName ) {
	return async ( { select, dispatch } ) => {
		if ( select( storeName ).haveSettingsChanged() ) {
			const { error } = await dispatch( storeName ).saveSettings();
			if ( error ) {
				return { error };
			}
		}

		await API.invalidateCache( 'modules', slug );

		return {};
	};
}

/**
 * Creates a default rollbackChanges control function.
 *
 * @since 1.45.0
 *
 * @param {string} storeName Datastore slug.
 * @return {Function} Control function to rollback settings changes.
 */
export function makeDefaultRollbackChanges( storeName ) {
	return ( { select, dispatch } ) => {
		if ( select( storeName ).haveSettingsChanged() ) {
			return dispatch( storeName ).rollbackSettings();
		}

		return {};
	};
}

/**
 * Creates a default canSubmitChanges function.
 *
 * @since 1.21.0
 *
 * @param {string} storeName Datastore slug.
 * @return {Function} A function to check if settings can be submitted.
 */
export function makeDefaultCanSubmitChanges( storeName ) {
	return ( select ) => {
		const strictSelect = createStrictSelect( select );
		const { haveSettingsChanged, isDoingSubmitChanges } =
			strictSelect( storeName );

		invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
		invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
	};
}

/**
 * Creates Default haveSettingsChanged.
 *
 * @since 1.129.0
 *
 * @return {boolean} True if the settings have changed, false otherwise.
 */
export function makeDefaultHaveSettingsChanged() {
	return ( select, state, keys ) => {
		const { settings, savedSettings } = state;

		if ( keys ) {
			return ! isEqual(
				pick( settings, keys ),
				pick( savedSettings, keys )
			);
		}

		return ! isEqual( settings, savedSettings );
	};
}
