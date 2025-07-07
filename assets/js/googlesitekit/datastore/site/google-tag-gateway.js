/**
 * `core/site` data store: google-tag-gateway.
 *
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

/* eslint-disable sitekit/jsdoc-no-unnamed-boolean-params */

/**
 * External dependencies
 */
import { isEqual, isPlainObject } from 'lodash';
import invariant from 'invariant';

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
import { CORE_SITE } from './constants';
import { CORE_USER } from '../user/constants';
import { CORE_MODULES } from '../../modules/datastore/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { isFeatureEnabled } from '../../../features';

const SET_GOOGLE_TAG_GATEWAY_ENABLED = 'SET_GOOGLE_TAG_GATEWAY_ENABLED';
const RESET_GOOGLE_TAG_GATEWAY_SETTINGS = 'RESET_GOOGLE_TAG_GATEWAY_SETTINGS';

const settingsReducerCallback = createReducer(
	( state, googleTagGatewaySettings ) => {
		state.googleTagGatewaySettings = googleTagGatewaySettings;
		state.googleTagGatewaySavedSettings = googleTagGatewaySettings;
	}
);

const fetchGetGoogleTagGatewaySettingsStore = createFetchStore( {
	baseName: 'getGoogleTagGatewaySettings',
	controlCallback: () =>
		get( 'core', 'site', 'gtg-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveGoogleTagGatewaySettingsStore = createFetchStore( {
	baseName: 'saveGoogleTagGatewaySettings',
	controlCallback: ( { settings } ) => {
		return set( 'core', 'site', 'gtg-settings', { settings } );
	},
	reducerCallback: settingsReducerCallback,
	argsToParams: ( settings ) => {
		const { isEnabled } = settings || {};
		return { settings: { isEnabled } };
	},
	validateParams: ( { settings } ) => {
		invariant(
			isPlainObject( settings ),
			'settings must be a plain object.'
		);

		invariant(
			typeof settings.isEnabled === 'boolean',
			'isEnabled must be a boolean.'
		);

		invariant(
			Object.keys( settings ).length === 1,
			'settings must have only the `isEnabled` property.'
		);
	},
} );

const fetchGetGTGServerRequirementStatusStore = createFetchStore( {
	baseName: 'getGTGServerRequirementStatus',
	controlCallback: () =>
		get( 'core', 'site', 'gtg-server-requirement-status', undefined, {
			useCache: false,
		} ),
	reducerCallback: settingsReducerCallback,
} );

const baseInitialState = {
	googleTagGatewaySettings: undefined,
	googleTagGatewaySavedSettings: undefined,
};

const baseActions = {
	/**
	 * Saves the Google tag gateway settings.
	 *
	 * @since 1.141.0
	 * @since 1.145.0 Added the survey trigger.
	 * @since n.e.x.t Renamed from `saveFirstPartyModeSettings` to `saveGoogleTagGatewaySettings`.
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveGoogleTagGatewaySettings() {
		const { dispatch, select } = yield commonActions.getRegistry();
		const settings = select( CORE_SITE ).getGoogleTagGatewaySettings();

		const results =
			yield fetchSaveGoogleTagGatewaySettingsStore.actions.fetchSaveGoogleTagGatewaySettings(
				settings
			);

		if ( results?.response?.isEnabled ) {
			yield commonActions.await(
				dispatch( CORE_USER ).triggerSurvey( 'gtg_setup_completed' )
			);
		}

		return results;
	},

	/**
	 * Sets the Google tag gateway enabled status.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Renamed from `setFirstPartyModeEnabled` to `setGoogleTagGatewayEnabled`.
	 *
	 * @param {boolean} isEnabled Google tag gateway enabled status.
	 * @return {Object} Redux-style action.
	 */
	setGoogleTagGatewayEnabled( isEnabled ) {
		return {
			type: SET_GOOGLE_TAG_GATEWAY_ENABLED,
			payload: { isEnabled },
		};
	},

	/**
	 * Returns the current settings back to the current saved values.
	 *
	 * @since 1.142.0
	 * @since n.e.x.t Renamed from `resetFirstPartyModeSettings` to `resetGoogleTagGatewaySettings`.
	 *
	 * @return {Object} Redux-style action.
	 */
	resetGoogleTagGatewaySettings() {
		return {
			payload: {},
			type: RESET_GOOGLE_TAG_GATEWAY_SETTINGS,
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_GOOGLE_TAG_GATEWAY_ENABLED: {
			state.googleTagGatewaySettings =
				state.googleTagGatewaySettings || {};
			state.googleTagGatewaySettings.isEnabled = !! payload.isEnabled;
			break;
		}

		case RESET_GOOGLE_TAG_GATEWAY_SETTINGS: {
			state.googleTagGatewaySettings =
				state.googleTagGatewaySavedSettings;
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getGoogleTagGatewaySettings() {
		const { select } = yield commonActions.getRegistry();

		const settings = select( CORE_SITE ).getGoogleTagGatewaySettings();

		if ( settings === undefined ) {
			yield fetchGetGoogleTagGatewaySettingsStore.actions.fetchGetGoogleTagGatewaySettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the Google tag gateway settings.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Renamed from `getFirstPartyModeSettings` to `getGoogleTagGatewaySettings`.
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Google tag gateway settings, or undefined if not loaded.
	 */
	getGoogleTagGatewaySettings: ( state ) => {
		return state.googleTagGatewaySettings;
	},

	/**
	 * Checks if Google tag gateway is enabled.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Renamed from `isFirstPartyModeEnabled` to `isGoogleTagGatewayEnabled`.
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if Google tag gateway is enabled, otherwise false. Returns undefined if the state is not loaded.
	 */
	isGoogleTagGatewayEnabled: createRegistrySelector( ( select ) => () => {
		const { isEnabled } =
			select( CORE_SITE ).getGoogleTagGatewaySettings() || {};

		return isEnabled;
	} ),

	/**
	 * Checks if the GTG service is determined to be healthy.
	 *
	 * @since 1.141.0
	 * @since n.e.x.t Renamed from `isFPMHealthy` to `isGTGHealthy`.
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|null|undefined} True if the GTG service is healthy, otherwise false. Returns undefined if the state is not loaded.
	 */
	isGTGHealthy: createRegistrySelector( ( select ) => () => {
		const { isGTGHealthy } =
			select( CORE_SITE ).getGoogleTagGatewaySettings() || {};

		return isGTGHealthy;
	} ),

	/**
	 * Checks if the GTag proxy script is accessible.
	 *
	 * @since 1.141.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|null|undefined} True if the `gtg/measurement.php` proxy script is accessible, otherwise false. Returns undefined if the state is not loaded.
	 */
	isScriptAccessEnabled: createRegistrySelector( ( select ) => () => {
		const { isScriptAccessEnabled } =
			select( CORE_SITE ).getGoogleTagGatewaySettings() || {};

		return isScriptAccessEnabled;
	} ),

	/**
	 * Indicates whether the current Google tag gateway settings have changed from what is saved.
	 *
	 * @since 1.142.0
	 * @since n.e.x.t Renamed from `haveFirstPartyModeSettingsChanged` to `haveGoogleTagGatewaySettingsChanged`.
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if the settings have changed, false otherwise.
	 */
	haveGoogleTagGatewaySettingsChanged( state ) {
		const { googleTagGatewaySettings, googleTagGatewaySavedSettings } =
			state;

		return ! isEqual(
			googleTagGatewaySettings,
			googleTagGatewaySavedSettings
		);
	},

	/**
	 * Checks if any Google tag gateway module is connected.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if any Google tag gateway module is connected, false otherwise.
	 */
	isAnyGoogleTagGatewayModuleConnected: createRegistrySelector(
		( select ) => () => {
			if ( ! isFeatureEnabled( 'googleTagGateway' ) ) {
				return false;
			}

			const { isModuleConnected } = select( CORE_MODULES );

			return (
				isModuleConnected( MODULE_SLUG_ANALYTICS_4 ) ||
				isModuleConnected( MODULE_SLUG_ADS )
			);
		}
	),
};

const store = combineStores(
	fetchGetGoogleTagGatewaySettingsStore,
	fetchSaveGoogleTagGatewaySettingsStore,
	fetchGetGTGServerRequirementStatusStore,
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
