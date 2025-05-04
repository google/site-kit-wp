/**
 * `modules/analytics-4` data store: enhanced measurement.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { isEqual, isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import { commonActions, combineStores } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { isValidPropertyID, isValidWebDataStreamID } from '../utils/validation';

const enhancedMeasurementSettingsFields = [
	'name',
	'streamEnabled',
	'scrollsEnabled',
	'outboundClicksEnabled',
	'siteSearchEnabled',
	'videoEngagementEnabled',
	'fileDownloadsEnabled',
	'pageChangesEnabled',
	'formInteractionsEnabled',
	'searchQueryParameter',
	'uriQueryParameter',
];

function validateEnhancedMeasurementSettings( enhancedMeasurementSettings ) {
	invariant(
		isPlainObject( enhancedMeasurementSettings ),
		'Enhanced measurement settings must be an object.'
	);
	Object.keys( enhancedMeasurementSettings ).forEach( ( key ) => {
		invariant(
			enhancedMeasurementSettingsFields.includes( key ),
			`Enhanced measurement settings must contain only valid keys. Invalid key: "${ key }"`
		);
	} );
}

const fetchStoreReducerCallback = createReducer(
	( state, enhancedMeasurementSettings, { propertyID, webDataStreamID } ) => {
		if ( ! state.enhancedMeasurement[ propertyID ] ) {
			state.enhancedMeasurement[ propertyID ] = {};
		}

		if ( ! state.enhancedMeasurement[ propertyID ][ webDataStreamID ] ) {
			state.enhancedMeasurement[ propertyID ][ webDataStreamID ] = {};
		}

		state.enhancedMeasurement[ propertyID ][ webDataStreamID ].settings =
			enhancedMeasurementSettings;

		state.enhancedMeasurement[ propertyID ][
			webDataStreamID
		].savedSettings = enhancedMeasurementSettings;
	}
);

const fetchGetEnhancedMeasurementSettingsStore = createFetchStore( {
	baseName: 'getEnhancedMeasurementSettings',
	controlCallback( { propertyID, webDataStreamID } ) {
		return get(
			'modules',
			'analytics-4',
			'enhanced-measurement-settings',
			{ propertyID, webDataStreamID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: fetchStoreReducerCallback,
	argsToParams( propertyID, webDataStreamID ) {
		return { propertyID, webDataStreamID };
	},
	validateParams( { propertyID, webDataStreamID } = {} ) {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
		invariant(
			isValidWebDataStreamID( webDataStreamID ),
			'A valid GA4 webDataStreamID is required.'
		);
	},
} );

const fetchUpdateEnhancedMeasurementSettingsStore = createFetchStore( {
	baseName: 'updateEnhancedMeasurementSettings',
	controlCallback: ( {
		propertyID,
		webDataStreamID,
		enhancedMeasurementSettings,
	} ) =>
		set( 'modules', 'analytics-4', 'enhanced-measurement-settings', {
			propertyID,
			webDataStreamID,
			enhancedMeasurementSettings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: (
		propertyID,
		webDataStreamID,
		enhancedMeasurementSettings
	) => ( {
		propertyID,
		webDataStreamID,
		enhancedMeasurementSettings,
	} ),
	validateParams: ( {
		propertyID,
		webDataStreamID,
		enhancedMeasurementSettings,
	} ) => {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
		invariant(
			isValidWebDataStreamID( webDataStreamID ),
			'A valid GA4 webDataStreamID is required.'
		);
		validateEnhancedMeasurementSettings( enhancedMeasurementSettings );
	},
} );

// Actions
const SET_ENHANCED_MEASUREMENT_SETTINGS = 'SET_ENHANCED_MEASUREMENT_SETTINGS';
const RESET_ENHANCED_MEASUREMENT_SETTINGS =
	'RESET_ENHANCED_MEASUREMENT_SETTINGS';

const baseInitialState = {
	enhancedMeasurement: {},
};

const baseActions = {
	/**
	 * Sets enhanced measurement settings.
	 *
	 * @since 1.110.0
	 *
	 * @param {string} propertyID      The GA4 property ID to set enhanced measurement settings for.
	 * @param {string} webDataStreamID The GA4 web data stream ID to set enhanced measurement settings for.
	 * @param {Object} settings        The GA4 enhanced measurement settings to set.
	 * @return {Object} Redux-style action.
	 */
	setEnhancedMeasurementSettings( propertyID, webDataStreamID, settings ) {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
		invariant(
			isValidWebDataStreamID( webDataStreamID ),
			'A valid GA4 webDataStreamID is required.'
		);
		validateEnhancedMeasurementSettings( settings );

		return {
			type: SET_ENHANCED_MEASUREMENT_SETTINGS,
			payload: {
				propertyID,
				webDataStreamID,
				settings,
			},
		};
	},

	/**
	 * Sets the `streamEnabled` setting for a given web data stream.
	 *
	 * @since 1.110.0
	 *
	 * @param {string}  propertyID      The GA4 property ID to set enhanced measurement settings for.
	 * @param {string}  webDataStreamID The GA4 web data stream ID to set enhanced measurement settings for.
	 * @param {boolean} enabled         Whether the `streamEnabled` setting should be enabled or not.
	 * @return {Object} Redux-style action.
	 */
	setEnhancedMeasurementStreamEnabled: createValidatedAction(
		( propertyID, webDataStreamID, enabled ) => {
			invariant(
				isValidPropertyID( propertyID ),
				'A valid GA4 propertyID is required.'
			);
			invariant(
				isValidWebDataStreamID( webDataStreamID ),
				'A valid GA4 webDataStreamID is required.'
			);
			invariant( enabled !== undefined, 'enabled is required.' );
			invariant(
				typeof enabled === 'boolean',
				'enabled must be a boolean.'
			);
		},
		function* ( propertyID, webDataStreamID, enabled ) {
			const registry = yield commonActions.getRegistry();

			const currentSettings = yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID
					)
			);

			if ( ! currentSettings ) {
				return null;
			}

			// TODO: Here we coerce `false` to `null`, for compatibility with the API response, which returns
			// `null` for all settings that are not enabled. This helps to ensure that we don't incorrectly consider
			// the setting to have changed in haveEnhancedMeasurementSettingsChanged().
			// We should address this in a more robust manner in future if we start using additional properties of
			// the settings object.
			const streamEnabled = enabled || null;

			const newSettings = {
				...currentSettings,
				streamEnabled,
			};

			return yield commonActions.await(
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID,
						newSettings
					)
			);
		}
	),

	/**
	 * Resets enhanced measurement settings to their saved values.
	 *
	 * @since 1.110.0
	 *
	 * @return {Object} Redux-style action.
	 */
	resetEnhancedMeasurementSettings() {
		return {
			type: RESET_ENHANCED_MEASUREMENT_SETTINGS,
			payload: {},
		};
	},

	/**
	 * Updates enhanced measurement settings in the server.
	 *
	 * @since 1.110.0
	 *
	 * @param {string} propertyID      The GA4 property ID to set enhanced measurement settings for.
	 * @param {string} webDataStreamID The GA4 web data stream ID to set enhanced measurement settings for.
	 * @return {Object} Redux-style action.
	 */
	updateEnhancedMeasurementSettings: createValidatedAction(
		( propertyID, webDataStreamID ) => {
			invariant(
				isValidPropertyID( propertyID ),
				'A valid GA4 propertyID is required.'
			);
			invariant(
				isValidWebDataStreamID( webDataStreamID ),
				'A valid GA4 webDataStreamID is required.'
			);
		},
		function* ( propertyID, webDataStreamID ) {
			const registry = yield commonActions.getRegistry();

			const currentSettings = yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getEnhancedMeasurementSettings(
						propertyID,
						webDataStreamID
					)
			);

			if ( ! currentSettings ) {
				return null;
			}

			return yield fetchUpdateEnhancedMeasurementSettingsStore.actions.fetchUpdateEnhancedMeasurementSettings(
				propertyID,
				webDataStreamID,
				currentSettings
			);
		}
	),
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_ENHANCED_MEASUREMENT_SETTINGS: {
			const { propertyID, webDataStreamID, settings } = payload;

			if ( ! state.enhancedMeasurement[ propertyID ] ) {
				state.enhancedMeasurement[ propertyID ] = {};
			}

			if (
				! state.enhancedMeasurement[ propertyID ][ webDataStreamID ]
			) {
				state.enhancedMeasurement[ propertyID ][ webDataStreamID ] = {};
			}

			state.enhancedMeasurement[ propertyID ][
				webDataStreamID
			].settings = settings;

			break;
		}

		case RESET_ENHANCED_MEASUREMENT_SETTINGS: {
			for ( const propertyID in state.enhancedMeasurement ) {
				for ( const webDataStreamID in state.enhancedMeasurement[
					propertyID
				] ) {
					const currentWebDataStream =
						state.enhancedMeasurement[ propertyID ][
							webDataStreamID
						];
					if ( currentWebDataStream.savedSettings ) {
						currentWebDataStream.settings =
							currentWebDataStream.savedSettings;
					} else {
						delete state.enhancedMeasurement[ propertyID ][
							webDataStreamID
						];
					}
				}
			}

			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*getEnhancedMeasurementSettings( propertyID, webDataStreamID ) {
		const registry = yield commonActions.getRegistry();
		// Only fetch enhanced measurement settings if there are none in the store for the given data stream.
		const enhancedMeasurementSettings = registry
			.select( MODULES_ANALYTICS_4 )
			.getEnhancedMeasurementSettings( propertyID, webDataStreamID );

		if ( enhancedMeasurementSettings === undefined ) {
			yield fetchGetEnhancedMeasurementSettingsStore.actions.fetchGetEnhancedMeasurementSettings(
				propertyID,
				webDataStreamID
			);
		}
	},

	*isEnhancedMeasurementStreamAlreadyEnabled( propertyID, webDataStreamID ) {
		const registry = yield commonActions.getRegistry();
		// Only fetch enhanced measurement settings if the `streamEnabled` setting is not already in the store.
		const isEnhancedMeasurementStreamEnabled = registry
			.select( MODULES_ANALYTICS_4 )
			.isEnhancedMeasurementStreamAlreadyEnabled(
				propertyID,
				webDataStreamID
			);

		if ( isEnhancedMeasurementStreamEnabled === undefined ) {
			yield fetchGetEnhancedMeasurementSettingsStore.actions.fetchGetEnhancedMeasurementSettings(
				propertyID,
				webDataStreamID
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the enhanced measurement settings for a given web data stream.
	 *
	 * @since 1.110.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} propertyID      The GA4 property ID to fetch web data streams for.
	 * @param {string} webDataStreamID The GA4 web data stream ID to fetch enhanced measurement settings for.
	 * @return {(Object|undefined)} An object with enhanced measurement settings; `undefined` if not loaded.
	 */
	getEnhancedMeasurementSettings( state, propertyID, webDataStreamID ) {
		return state.enhancedMeasurement[ propertyID ]?.[ webDataStreamID ]
			?.settings;
	},

	/**
	 * Checks if the `streamEnabled` setting is enabled for a given web data stream.
	 *
	 * @since 1.110.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} propertyID      The GA4 property ID to check.
	 * @param {string} webDataStreamID The GA4 web data stream ID to check.
	 * @return {boolean}               True if `streamEnabled` is on, otherwise false; `undefined` if not loaded.
	 */
	isEnhancedMeasurementStreamEnabled: createRegistrySelector(
		( select ) => ( state, propertyID, webDataStreamID ) => {
			const settings = select(
				MODULES_ANALYTICS_4
			).getEnhancedMeasurementSettings( propertyID, webDataStreamID );

			if ( settings === undefined ) {
				return undefined;
			}

			return !! settings.streamEnabled;
		}
	),

	/**
	 * Checks if the `streamEnabled` setting is enabled for a given web data stream within the saved settings.
	 *
	 * @since 1.113.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} propertyID      The GA4 property ID to check.
	 * @param {string} webDataStreamID The GA4 web data stream ID to check.
	 * @return {boolean}               True if `streamEnabled` is on, otherwise false; `undefined` if not loaded.
	 */
	isEnhancedMeasurementStreamAlreadyEnabled(
		state,
		propertyID,
		webDataStreamID
	) {
		const { savedSettings } =
			state.enhancedMeasurement[ propertyID ]?.[ webDataStreamID ] || {};

		if ( savedSettings === undefined ) {
			return undefined;
		}

		return !! savedSettings.streamEnabled;
	},

	/**
	 * Checks if the settings have changed compared to the saved settings for a given web data stream.
	 *
	 * @since 1.110.0
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} propertyID      The GA4 property ID to check.
	 * @param {string} webDataStreamID The GA4 web data stream ID to check.
	 * @return {boolean}               True if settings have changed, otherwise false.
	 */
	haveEnhancedMeasurementSettingsChanged(
		state,
		propertyID,
		webDataStreamID
	) {
		const { settings, savedSettings } =
			state.enhancedMeasurement[ propertyID ]?.[ webDataStreamID ] || {};

		return ! isEqual( settings, savedSettings );
	},

	/**
	 * This is a utility selector that checks if either the GA4 module settings, or the
	 * current web data stream's enhanced measurement settings, have changed.
	 *
	 * @since 1.111.0
	 *
	 * @return {boolean} True if settings have changed, otherwise false.
	 */
	haveAnyGA4SettingsChanged: createRegistrySelector( ( select ) => () => {
		const {
			getPropertyID,
			getWebDataStreamID,
			haveEnhancedMeasurementSettingsChanged,
			haveSettingsChanged,
		} = select( MODULES_ANALYTICS_4 );

		if ( haveSettingsChanged() ) {
			return true;
		}

		const propertyID = getPropertyID();
		const webDataStreamID = getWebDataStreamID();

		if (
			isValidPropertyID( propertyID ) &&
			isValidWebDataStreamID( webDataStreamID ) &&
			haveEnhancedMeasurementSettingsChanged(
				propertyID,
				webDataStreamID
			)
		) {
			return true;
		}

		return false;
	} ),
};

const store = combineStores(
	fetchGetEnhancedMeasurementSettingsStore,
	fetchUpdateEnhancedMeasurementSettingsStore,
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
