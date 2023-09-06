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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { isValidPropertyID, isValidWebDataStreamID } from '../utils/validation';

const fetchStoreReducerCallback = createReducer(
	( state, enhancedMeasurementSettings, { propertyID, webDataStreamID } ) => {
		if ( ! state.enhancedMeasurements[ propertyID ] ) {
			state.enhancedMeasurements[ propertyID ] = {};
		}

		if ( ! state.enhancedMeasurements[ propertyID ][ webDataStreamID ] ) {
			state.enhancedMeasurements[ propertyID ][ webDataStreamID ] = {};
		}

		state.enhancedMeasurements[ propertyID ][ webDataStreamID ].settings =
			enhancedMeasurementSettings;

		state.enhancedMeasurements[ propertyID ][
			webDataStreamID
		].savedSettings = enhancedMeasurementSettings;
	}
);

const fetchGetEnhancedMeasurementSettingsStore = createFetchStore( {
	baseName: 'getEnhancedMeasurementSettings',
	controlCallback( { propertyID, webDataStreamID } ) {
		return API.get(
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

const fetchSaveEnhancedMeasurementSettingsStore = createFetchStore( {
	baseName: 'saveEnhancedMeasurementSettings',
	controlCallback: ( {
		propertyID,
		webDataStreamID,
		enhancedMeasurementSettings,
	} ) =>
		API.set( 'core', 'analytics-4', 'enhanced-measurement-settings', {
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
	validateParams: (
		propertyID,
		webDataStreamID,
		enhancedMeasurementSettings
	) => {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
		invariant(
			isValidWebDataStreamID( webDataStreamID ),
			'A valid GA4 webDataStreamID is required.'
		);
		invariant(
			// TODO: Additional validation for the shape of enhancedMeasurementSettings?
			isPlainObject( enhancedMeasurementSettings ),
			'Enhanced measurement settings must be an object.'
		);
	},
} );

// Actions
const SET_ENHANCED_MEASUREMENT_SETTINGS = 'SET_ENHANCED_MEASUREMENT_SETTINGS';

const baseInitialState = {
	enhancedMeasurements: {},
};

const baseActions = {
	/**
	 * Sets enhanced measurement settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} propertyID      The GA4 property ID to set enhanced measurement settings for.
	 * @param {string} webDataStreamID The GA4 web data stream ID to set enhanced measurement settings for.
	 * @param {Object} settings        The GA4 enhanced measurement settings to set.
	 * @return {Object} Redux-style action.
	 */
	setEnhancedMeasurementSettings( propertyID, webDataStreamID, settings ) {
		return {
			type: SET_ENHANCED_MEASUREMENT_SETTINGS,
			payload: {
				propertyID,
				webDataStreamID,
				settings,
			},
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_ENHANCED_MEASUREMENT_SETTINGS: {
			const { propertyID, webDataStreamID, settings } = payload;

			state.enhancedMeasurements[ propertyID ][
				webDataStreamID
			].settings = settings;

			break;
		}
		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*getEnhancedMeasurementSettings( propertyID, webDataStreamID ) {
		const registry = yield Data.commonActions.getRegistry();
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
};

const baseSelectors = {
	/**
	 * Gets the enhanced measurement settings for a given web data stream.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} propertyID      The GA4 property ID to fetch web data streams for.
	 * @param {string} webDataStreamID The GA4 web data stream ID to fetch enhanced measurement settings for.
	 * @return {(Object|undefined)} An object with enhanced measurement settings; `undefined` if not loaded.
	 */
	getEnhancedMeasurementSettings( state, propertyID, webDataStreamID ) {
		return state.enhancedMeasurements[ propertyID ]?.[ webDataStreamID ]
			?.settings;
	},
};

const store = Data.combineStores(
	fetchGetEnhancedMeasurementSettingsStore,
	fetchSaveEnhancedMeasurementSettingsStore,
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
