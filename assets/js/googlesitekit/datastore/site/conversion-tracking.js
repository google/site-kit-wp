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
 * External dependencies
 */
import { isPlainObject, isEqual } from 'lodash';
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { createReducer } from '../../data/create-reducer';
import { CORE_SITE } from './constants';

const { createRegistrySelector } = Data;
const { getRegistry } = Data.commonActions;

const SET_CONVERSION_TRACKING_ENABLED = 'SET_CONVERSION_TRACKING_ENABLED';
const RESET_CONVERSION_TRACKING_SETTINGS = 'RESET_CONVERSION_TRACKING_SETTINGS';

const settingsReducerCallback = createReducer( ( state, settings ) => {
	state.conversionTracking.settings = settings;
	state.conversionTracking.savedSettings = settings;
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
		savedSettings: undefined,
	},
};

const baseActions = {
	/**
	 * Saves the Conversion Tracking settings.
	 *
	 * @since 1.128.0
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
	 * @since 1.128.0
	 *
	 * @param {string} enabled Consent Mode enabled status.
	 * @return {Object} Redux-style action.
	 */
	setConversionTrackingEnabled( enabled ) {
		return {
			type: SET_CONVERSION_TRACKING_ENABLED,
			payload: { enabled },
		};
	},

	/**
	 * Returns the current settings back to the current saved values.
	 *
	 * @since 1.129.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	resetConversionTrackingSettings() {
		return {
			payload: {},
			type: RESET_CONVERSION_TRACKING_SETTINGS,
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

		case RESET_CONVERSION_TRACKING_SETTINGS:
			state.conversionTracking.settings =
				state.conversionTracking.savedSettings;
			break;

		default:
			break;
	}
} );

const baseSelectors = {
	/**
	 * Gets the Conversion Tracking settings.
	 *
	 * @since 1.128.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Conversion Tracking settings, or `undefined` if not loaded.
	 */
	getConversionTrackingSettings: ( state ) => {
		return state.conversionTracking.settings;
	},

	/**
	 * Gets the Consent Mode enabled status.
	 *
	 * @since 1.128.0
	 *
	 * @return {boolean|undefined} Consent Mode enabled status, or `undefined` if not loaded.
	 */
	isConversionTrackingEnabled: createRegistrySelector( ( select ) => () => {
		const { enabled } =
			select( CORE_SITE ).getConversionTrackingSettings() || {};

		return enabled;
	} ),

	/**
	 * Indicates whether the current settings have changed from what is saved.
	 *
	 * @since 1.128.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if the settings have changed, false otherwise.
	 */
	haveConversionTrackingSettingsChanged( state ) {
		const { settings, savedSettings } = state.conversionTracking;

		return ! isEqual( settings, savedSettings );
	},
};

const baseResolvers = {
	*getConversionTrackingSettings() {
		const { select } = yield getRegistry();
		const conversionTrackingSettings =
			select( CORE_SITE ).getConversionTrackingSettings();

		if ( conversionTrackingSettings ) {
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
