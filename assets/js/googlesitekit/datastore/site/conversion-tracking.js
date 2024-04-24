/**
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { createReducer } from '../../data/create-reducer';
import { CORE_SITE } from './constants';
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

const { createRegistrySelector } = Data;
const { getRegistry } = Data.commonActions;

const SET_CONVERSION_TRACKING_ENABLED = 'SET_CONVERSION_TRACKING_ENABLED';

const settingsReducerCallback = createReducer( ( state, settings ) => {
	state.conversionTracking.settings = settings;
} );

const fetchGetConversionTrackingSettingsStore = createFetchStore( {
	baseName: 'getConversionTrackingSettings',
	controlCallback: () => {
		return API.get( 'core', 'site', 'conversion-tracking', null, {
			useCache: false,
		} );
	},
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveConversionTrackingSettingsStore = createFetchStore( {
	baseName: 'saveConversionTrackingSettings',
	controlCallback: ( { settings } ) => {
		return API.set( 'core', 'site', 'conversion-tracking', { settings } );
	},
	reducerCallback: settingsReducerCallback,
	argsToParams: ( settings ) => {
		return { settings };
	},
	validateParams: ( { settings } ) => {
		invariant(
			isPlainObject( settings ),
			'settings must be a plain object.'
		);
	},
} );

const baseInitialState = {
	conversionTracking: {
		settings: undefined,
	},
};

const baseActions = {
	/**
	 * Saves the Conversion Tracking settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveConversionTrackingSettings() {
		const { select } = yield getRegistry();
		const settings = select( CORE_SITE ).getConversionTrackingSettings();

		return yield fetchSaveConversionTrackingSettingsStore.actions.fetchSaveConversionTrackingSettings(
			settings
		);
	},

	/**
	 * Sets the Conversion Tracking enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} enabled Conversion Tracking enabled status.
	 * @return {Object} Redux-style action.
	 */
	setConversionTrackingEnabled( enabled ) {
		return {
			type: SET_CONVERSION_TRACKING_ENABLED,
			payload: { enabled },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_CONVERSION_TRACKING_ENABLED:
			state.conversionTracking.settings =
				state.conversionTracking.settings || {};
			state.conversionTracking.settings.enabled = !! payload.enabled;
			break;

		default:
			break;
	}
} );

const baseSelectors = {
	/**
	 * Gets the Conversion Tracking settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Conversion Tracking settings, or `undefined` if not loaded.
	 */
	getConversionTrackingSettings: ( state ) => {
		return state.conversionTracking.settings;
	},

	/**
	 * Gets the Conversion Tracking enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} Conversion Tracking enabled status, or `undefined` if not loaded.
	 */
	isConversionTrackingEnabled: createRegistrySelector( ( select ) => () => {
		const { enabled } =
			select( CORE_SITE ).getConversionTrackingSettings() || {};

		return enabled;
	} ),
};

const baseResolvers = {
	*getConversionTrackingSettings() {
		const { select } = yield getRegistry();

		if ( select( CORE_SITE ).getConversionTrackingSettings() ) {
			return;
		}

		yield fetchGetConversionTrackingSettingsStore.actions.fetchGetConversionTrackingSettings();
	},
};

const store = Data.combineStores(
	fetchGetConversionTrackingSettingsStore,
	fetchSaveConversionTrackingSettingsStore,
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
