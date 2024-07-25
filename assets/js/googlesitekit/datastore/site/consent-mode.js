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
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { createReducer } from '../../data/create-reducer';
import { CORE_MODULES } from '../../modules/datastore/constants';
import { CORE_SITE } from './constants';
import { CORE_USER } from '../user/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { actions as errorStoreActions } from '../../data/create-error-store';
const { clearError, receiveError } = errorStoreActions;

const { getRegistry } = commonActions;

const SET_CONSENT_MODE_ENABLED = 'SET_CONSENT_MODE_ENABLED';
const INSTALL_ACTIVATE_WP_CONSENT_API_RESPONSE =
	'INSTALL_ACTIVATE_WP_CONSENT_API_RESPONSE';
const INSTALL_ACTIVATE_WP_CONSENT_API_FETCHING =
	'INSTALL_ACTIVATE_WP_CONSENT_API_FETCHING';

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

const fetchInstallActivateWPConsentAPI = createFetchStore( {
	baseName: 'installActivateWPConsentAPI',
	controlCallback: async ( { nonce } ) => {
		/**
		 * This function utilizes an AJAX approach instead of the standardized REST approach
		 * due to the requirement of the Plugin_Upgrader class, which relies on functions
		 * from `admin.php` among others. These functions are properly loaded during the
		 * AJAX callback, ensuring the installation and activation processes can execute correctly.
		 */
		const data = new FormData();
		data.append( 'action', 'install_activate_wp_consent_api' );
		data.append( '_ajax_nonce', nonce );

		const response = await fetch( global.ajaxurl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		} );

		return response.json();
	},
	argsToParams: ( { nonce } ) => {
		return {
			nonce,
		};
	},
	validateParams: ( { nonce } ) => {
		invariant( typeof nonce === 'string', 'nonce must be a string.' );
	},
} );

const fetchActivateConsentAPI = createFetchStore( {
	baseName: 'activateConsentAPI',
	controlCallback: () => {
		return API.set( 'core', 'site', 'consent-api-activate', null, {
			useCache: false,
		} );
	},
} );

const baseInitialState = {
	consentMode: {
		settings: undefined,
		apiInfo: undefined,
		apiInstallResponse: undefined,
		isApiFetching: undefined,
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

	/**
	 * Installs and activates the WP Consent API Plugin on the backend.
	 *
	 * @since 1.132.0
	 */
	*installActivateWPConsentAPI() {
		const registry = yield getRegistry();

		yield clearError( 'installActivateWPConsentAPI', [] );

		yield {
			type: INSTALL_ACTIVATE_WP_CONSENT_API_FETCHING,
			payload: true,
		};

		yield commonActions.await(
			registry.resolveSelect( CORE_USER ).getNonces()
		);
		const nonce = registry.select( CORE_USER ).getNonce( 'updates' );

		if ( nonce === undefined ) {
			const error = registry
				.select( CORE_USER )
				.getErrorForSelector( 'getNonces' );

			yield receiveError( error, 'installActivateWPConsentAPI', [] );

			yield {
				type: INSTALL_ACTIVATE_WP_CONSENT_API_FETCHING,
				payload: false,
			};

			registry
				.dispatch( CORE_USER )
				.invalidateResolution( 'getNonces', [] );

			return;
		}

		const { response } =
			yield fetchInstallActivateWPConsentAPI.actions.fetchInstallActivateWPConsentAPI(
				{ nonce }
			);

		yield {
			type: INSTALL_ACTIVATE_WP_CONSENT_API_RESPONSE,
			payload: response,
		};

		yield {
			type: INSTALL_ACTIVATE_WP_CONSENT_API_FETCHING,
			payload: false,
		};

		// Fetch the latest info, if plugin is installed and activated it will show the success message.
		yield fetchGetConsentAPIInfoStore.actions.fetchGetConsentAPIInfo();
	},

	/**
	 * Activates the WP Consent API Plugin on the backend.
	 *
	 * @since 1.132.0
	 */
	*activateConsentAPI() {
		const response =
			yield fetchActivateConsentAPI.actions.fetchActivateConsentAPI();

		yield {
			type: INSTALL_ACTIVATE_WP_CONSENT_API_RESPONSE,
			payload: response,
		};

		// Fetch the latest info, if plugin is activated it will show the success message.
		yield fetchGetConsentAPIInfoStore.actions.fetchGetConsentAPIInfo();
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_CONSENT_MODE_ENABLED:
			state.consentMode.settings = state.consentMode.settings || {};
			state.consentMode.settings.enabled = !! payload.enabled;
			break;

		case INSTALL_ACTIVATE_WP_CONSENT_API_RESPONSE:
			state.consentMode.apiInstallResponse = payload;
			break;

		case INSTALL_ACTIVATE_WP_CONSENT_API_FETCHING:
			state.consentMode.isApiFetching = payload;
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
	 * Gets the WP Consent API Install/Activate Response.
	 *
	 * @since 1.132.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} WP Consent Mode API response, or `undefined` if not loaded.
	 */
	getApiInstallResponse: ( state ) => {
		return state.consentMode.apiInstallResponse;
	},

	/**
	 * Gets the WP Consent API Install/Activate isApiFetching value.
	 *
	 * @since 1.132.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} Gets the value if WP Consent Mode API is currently fetching, or `undefined` if not loaded.
	 */
	isApiFetching: ( state ) => {
		return state.consentMode.isApiFetching;
	},

	/**
	 * Returns true if Google Ads is in use, either through a linked Analytics & Ads
	 * account, an Ads conversion tracking ID, or via Analytics tag config.
	 *
	 * @since 1.124.0
	 * @since 1.125.0 Updated to consider Ads connection status via the Analytics tag config, and to source Conversion ID field from Ads module.
	 *
	 * @return {boolean|undefined} True if Google Ads is in use, false otherwise. Undefined if the selectors have not loaded.
	 */
	isAdsConnected: createRegistrySelector( ( select ) => () => {
		const { isModuleConnected } = select( CORE_MODULES );

		// The Ads module being connected implies that an Ads conversion tracking
		// ID is set. If so, return true.
		if ( isModuleConnected( 'ads' ) ) {
			return true;
		}

		if ( isModuleConnected( 'analytics-4' ) ) {
			const { getAdsLinked, getGoogleTagContainerDestinationIDs } =
				select( MODULES_ANALYTICS_4 );

			const adsLinked = getAdsLinked();
			const googleTagContainerDestinationIDs =
				getGoogleTagContainerDestinationIDs();

			// If necessary settings have not loaded, return undefined.
			if (
				[ adsLinked, googleTagContainerDestinationIDs ].includes(
					undefined
				)
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

			return !! adsLinked;
		}

		return false;
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

const store = combineStores(
	fetchGetConsentModeSettingsStore,
	fetchSaveConsentModeSettingsStore,
	fetchGetConsentAPIInfoStore,
	fetchInstallActivateWPConsentAPI,
	fetchActivateConsentAPI,
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
