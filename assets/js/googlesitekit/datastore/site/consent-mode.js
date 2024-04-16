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
import { CORE_MODULES } from '../../modules/datastore/constants';
import { CORE_SITE } from './constants';
import { MODULES_ADS } from '../../../modules/ads/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

const { createRegistrySelector } = Data;
const { getRegistry } = Data.commonActions;

const SET_CONSENT_MODE_ENABLED = 'SET_CONSENT_MODE_ENABLED';

const settingsReducerCallback = createReducer( ( state, settings ) => {
	state.consentMode.settings = settings;
} );

const fetchGetConsentModeSettingsStore = createFetchStore( {
	baseName: 'getConsentModeSettings',
	controlCallback: () => {
		return API.get( 'core', 'site', 'consent-mode', null, {
			useCache: false,
		} );
	},
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveConsentModeSettingsStore = createFetchStore( {
	baseName: 'saveConsentModeSettings',
	controlCallback: ( { settings } ) => {
		return API.set( 'core', 'site', 'consent-mode', { settings } );
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

const fetchGetConsentAPIInfoStore = createFetchStore( {
	baseName: 'getConsentAPIInfo',
	controlCallback: () => {
		return API.get( 'core', 'site', 'consent-api-info', null, {
			useCache: false,
		} );
	},
	reducerCallback: createReducer( ( state, apiInfo ) => {
		state.consentMode.apiInfo = apiInfo;
	} ),
} );

const baseInitialState = {
	consentMode: {
		settings: undefined,
		apiInfo: undefined,
	},
};

const baseActions = {
	/**
	 * Saves the Consent Mode settings.
	 *
	 * @since 1.122.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveConsentModeSettings() {
		const { select } = yield getRegistry();
		const settings = select( CORE_SITE ).getConsentModeSettings();

		return yield fetchSaveConsentModeSettingsStore.actions.fetchSaveConsentModeSettings(
			settings
		);
	},

	/**
	 * Sets the Consent Mode enabled status.
	 *
	 * @since 1.122.0
	 *
	 * @param {string} enabled Consent Mode enabled status.
	 * @return {Object} Redux-style action.
	 */
	setConsentModeEnabled( enabled ) {
		return {
			type: SET_CONSENT_MODE_ENABLED,
			payload: { enabled },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_CONSENT_MODE_ENABLED:
			state.consentMode.settings = state.consentMode.settings || {};
			state.consentMode.settings.enabled = !! payload.enabled;
			break;

		default:
			break;
	}
} );

const baseSelectors = {
	/**
	 * Gets the Consent Mode settings.
	 *
	 * @since 1.122.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Consent Mode settings, or `undefined` if not loaded.
	 */
	getConsentModeSettings: ( state ) => {
		return state.consentMode.settings;
	},

	/**
	 * Gets the Consent Mode enabled status.
	 *
	 * @since 1.122.0
	 *
	 * @return {boolean|undefined} Consent Mode enabled status, or `undefined` if not loaded.
	 */
	isConsentModeEnabled: createRegistrySelector( ( select ) => () => {
		const { enabled } = select( CORE_SITE ).getConsentModeSettings() || {};

		return enabled;
	} ),

	/**
	 * Gets the WP Consent Mode API info.
	 *
	 * @since 1.122.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} WP Consent Mode API info, or `undefined` if not loaded.
	 */
	getConsentAPIInfo: ( state ) => {
		return state.consentMode.apiInfo;
	},

	/**
	 * Returns true if Google Ads is in use, either through a linked Analytics & Ads
	 * account, an Ads conversion tracking ID, or via Analytics tag config.
	 *
	 * @since 1.124.0
	 * @since n.e.x.t Updated to consider Ads connection status via the Analytics tag config, and to source Conversion ID field from Ads module.
	 *
	 * @return {boolean|undefined} True if Google Ads is in use, false otherwise. Undefined if the selectors have not loaded.
	 */
	isAdsConnected: createRegistrySelector( ( select ) => () => {
		const { isModuleConnected } = select( CORE_MODULES );

		if (
			! isModuleConnected( 'analytics-4' ) ||
			! isModuleConnected( 'ads' )
		) {
			return false;
		}

		const { getAdsLinked, getGoogleTagContainerDestinationIDs } =
			select( MODULES_ANALYTICS_4 );
		const { getConversionID } = select( MODULES_ADS );

		const conversionID = getConversionID();
		const adsLinked = getAdsLinked();
		const googleTagContainerDestinationIDs =
			getGoogleTagContainerDestinationIDs();

		if (
			[
				conversionID,
				adsLinked,
				googleTagContainerDestinationIDs,
			].includes( undefined )
		) {
			return undefined;
		}

		if (
			Array.isArray( googleTagContainerDestinationIDs ) &&
			googleTagContainerDestinationIDs.some( ( id ) =>
				id.startsWith( 'AW-' )
			)
		) {
			return true;
		}

		return !! conversionID || !! adsLinked;
	} ),
};

const baseResolvers = {
	*getConsentModeSettings() {
		const { select } = yield getRegistry();

		if ( select( CORE_SITE ).getConsentModeSettings() ) {
			return;
		}

		yield fetchGetConsentModeSettingsStore.actions.fetchGetConsentModeSettings();
	},

	*getConsentAPIInfo() {
		const { select } = yield getRegistry();

		if ( select( CORE_SITE ).getConsentAPIInfo() ) {
			return;
		}

		yield fetchGetConsentAPIInfoStore.actions.fetchGetConsentAPIInfo();
	},
};

const store = Data.combineStores(
	fetchGetConsentModeSettingsStore,
	fetchSaveConsentModeSettingsStore,
	fetchGetConsentAPIInfoStore,
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
