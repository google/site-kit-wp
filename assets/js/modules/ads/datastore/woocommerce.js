/**
 * `modules/ads` data store: woocommerce.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

import { createRegistrySelector } from 'googlesitekit-data';
import { MODULES_ADS } from './constants';

function getPluginStatusProperty( propName, plugin ) {
	return createRegistrySelector( ( select ) => () => {
		const {
			getWooCommercePluginStatus,
			getGoogleForWooCommercePluginStatus,
		} = select( MODULES_ADS );

		const getPluginStatus =
			plugin === 'WooCommerce'
				? getWooCommercePluginStatus
				: getGoogleForWooCommercePluginStatus;

		const pluginStatus = getPluginStatus() || [];
		return pluginStatus[ propName ];
	} );
}

export const selectors = {
	/**
	 * Gets WooCommerce active property from plugin status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Plugin status array.
	 */
	isWooCommerceActive: getPluginStatusProperty( 'active', 'WooCommerce' ),

	/**
	 * Gets Google for WooCommerce installed property from plugin status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Plugin status property value. Undefined if data is not resolved.
	 */
	isGoogleForWooCommercePresent: getPluginStatusProperty(
		'installed',
		'GoogleForWooCommerce'
	),

	/**
	 * Gets Google for WooCommerce active property from plugin status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Plugin status property value. Undefined if data is not resolved.
	 */
	isGoogleForWooCommerceActive: getPluginStatusProperty(
		'active',
		'GoogleForWooCommerce'
	),

	/**
	 * Gets Google for WooCommerce adsConnected property from plugin status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Plugin status property value. Undefined if data is not resolved.
	 */
	isGoogleForWooCommerceAdsAccountLinked: getPluginStatusProperty(
		'adsConnected',
		'GoogleForWooCommerce'
	),
};

const store = {
	selectors,
};

export default store;
