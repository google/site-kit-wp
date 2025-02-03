/**
 * `modules/ads` data store: module data.
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

/**
 * External dependencies.
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { createRegistrySelector } from 'googlesitekit-data';
import { MODULES_ADS } from './constants';
import { controls } from '../../../googlesitekit/datastore/site/info';

function getModuleDataProperty( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const moduleData = select( MODULES_ADS ).getModuleData() || [];
		return moduleData[ propName ];
	} );
}

// Actions
const RECEIVE_MODULE_DATA = 'RECEIVE_MODULE_DATA';

export const initialState = {
	moduleData: {
		supportedConversionEvents: undefined,
		plugins: undefined,
	},
};

export const actions = {
	/**
	 * Stores module data in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitModulesData`), set by PHP.
	 *
	 * @since 1.127.0
	 * @private
	 *
	 * @param {Object} moduleData Module data, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveModuleData( moduleData ) {
		invariant( moduleData, 'moduleData is required.' );

		return {
			payload: moduleData,
			type: RECEIVE_MODULE_DATA,
		};
	},
};

export const reducer = ( state, { payload, type } ) => {
	switch ( type ) {
		case RECEIVE_MODULE_DATA: {
			const { supportedConversionEvents, plugins } = payload;
			const moduleData = { supportedConversionEvents, plugins };

			return {
				...state,
				moduleData,
			};
		}

		default: {
			return state;
		}
	}
};

export const resolvers = {
	*getModuleData() {
		const moduleDataAds = global._googlesitekitModulesData?.ads;

		if ( ! moduleDataAds ) {
			return;
		}

		yield actions.receiveModuleData( moduleDataAds );
	},
};

export const selectors = {
	/**
	 * Gets all site info from this data store.
	 *
	 * Not intended to be used publicly; this is largely here so other selectors can
	 * request data using the selector/resolver pattern.
	 *
	 * @since 1.127.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Module data.
	 */
	getModuleData( state ) {
		return state.moduleData;
	},

	/**
	 * Gets supported conversion events.
	 *
	 * @since 1.127.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} List of supported conversion events.
	 */
	getSupportedConversionEvents: getModuleDataProperty(
		'supportedConversionEvents'
	),

	/**
	 * Checks if woocommerce is active.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if it is, false if not.
	 */
	isWooCommerceActive: createRegistrySelector( ( select ) => () => {
		const moduleData = select( MODULES_ADS ).getModuleData() || [];

		return moduleData?.plugins?.woocommerce?.active;
	} ),

	/**
	 * Checks if Google for WooCommerce is present.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if it is, false if not.
	 */
	isGoogleForWooCommercePresent: createRegistrySelector( ( select ) => () => {
		const moduleData = select( MODULES_ADS ).getModuleData() || [];

		return moduleData?.plugins?.hasOwnProperty( 'google-listings-and-ads' );
	} ),

	/**
	 * Checks if Google for WooCommerce is active.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if it is, false if not.
	 */
	isGoogleForWooCommerceActive: createRegistrySelector( ( select ) => () => {
		const moduleData = select( MODULES_ADS ).getModuleData() || [];

		return moduleData?.plugins?.[ 'google-listings-and-ads' ]?.active;
	} ),

	/**
	 * Checks if an Ads account is linked via Google for WooCommerce.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if it is, false if not.
	 */
	isGoogleForWooCommerceAdsAccountLinked: createRegistrySelector(
		( select ) => () => {
			const moduleData = select( MODULES_ADS ).getModuleData() || [];

			return moduleData?.plugins?.[ 'google-listings-and-ads' ]
				?.adsConnected;
		}
	),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
