/**
 * `core/site` data store: plugin status.
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

/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { createRegistrySelector } from 'googlesitekit-data';
import { AVAILABLE_PLUGINS, CORE_SITE, PLUGINS } from './constants';

function getPluginStatusProperty( propName, plugin ) {
	invariant( propName, 'propName is required.' );
	invariant( plugin, 'plugin is required.' );
	invariant( AVAILABLE_PLUGINS.includes( plugin ), 'Invalid plugin.' );

	return createRegistrySelector( ( select ) => () => {
		const { getPluginsData } = select( CORE_SITE );

		const pluginData = getPluginsData() || [];
		const pluginStatus = pluginData[ plugin ] || [];

		return pluginStatus[ propName ];
	} );
}

export const selectors = {
	/**
	 * Determines whether the WooCommerce plugin is installed or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the plugin is installed, false if it is not, and undefined if data is being resolved.
	 */
	isWooCommerceInstalled: getPluginStatusProperty(
		'installed',
		PLUGINS.WOOCOMMERCE
	),

	/**
	 * Determines whether the WooCommerce plugin is activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the plugin is activated, false if it is not, and undefined if data is being resolved.
	 */
	isWooCommerceActivated: getPluginStatusProperty(
		'active',
		PLUGINS.WOOCOMMERCE
	),

	/**
	 * Determines whether the Google for WooCommerce plugin is installed or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the plugin is installed, false if it is not, and undefined if data is being resolved.
	 */
	isGoogleForWooCommerceInstalled: getPluginStatusProperty(
		'installed',
		PLUGINS.GOOGLE_FOR_WOOCOMMERCE
	),

	/**
	 * Determines whether the Google for WooCommerce plugin is activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the plugin is activated, false if it is not, and undefined if data is being resolved.
	 */
	isGoogleForWooCommerceActivated: getPluginStatusProperty(
		'active',
		PLUGINS.GOOGLE_FOR_WOOCOMMERCE
	),

	/**
	 * Determines whether the Google for WooCommerce plugin has the linked Ads account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True if the plugin has linked Ads account, false if it doesn't have it, and undefined if data is being resolved.
	 */
	hasGoogleForWooCommerceAdsAccount: getPluginStatusProperty(
		'adsConnected',
		PLUGINS.GOOGLE_FOR_WOOCOMMERCE
	),
};

const store = {
	selectors,
};

export default store;
