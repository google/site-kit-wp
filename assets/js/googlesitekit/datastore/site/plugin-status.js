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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

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
	 * Gets WooCommerce active property from plugin status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Plugin status array.
	 */
	isWooCommerceActive: getPluginStatusProperty(
		'active',
		PLUGINS.WOOCOMMERCE
	),

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
		PLUGINS.GOOGLE_FOR_WOOCOMMERCE
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
		PLUGINS.GOOGLE_FOR_WOOCOMMERCE
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
		PLUGINS.GOOGLE_FOR_WOOCOMMERCE
	),

	/**
	 * Determines whether the WooCommerce redirect modal should be displayed.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Returns `true` if the modal should be shown, `false` if it shouldn't, and `undefined` if data is not yet resolved.
	 */
	shouldShowWooCommerceRedirectModal: createRegistrySelector(
		( select ) => () => {
			const {
				isWooCommerceActive,
				isGoogleForWooCommerceActive,
				isGoogleForWooCommerceAdsAccountLinked,
			} = select( CORE_SITE );

			if (
				isWooCommerceActive() === undefined ||
				isGoogleForWooCommerceActive() === undefined ||
				isGoogleForWooCommerceAdsAccountLinked() === undefined
			) {
				return undefined;
			}

			if (
				( isWooCommerceActive() &&
					isGoogleForWooCommerceActive() === false ) ||
				( isWooCommerceActive() &&
					isGoogleForWooCommerceActive() &&
					isGoogleForWooCommerceAdsAccountLinked() === false )
			) {
				return true;
			}

			return false;
		}
	),

	/**
	 * Gets Google for WooCommerce redirect URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The appropriate redirect URL, or `undefined` if data is not resolved.
	 */
	getGoogleForWooCommerceRedirectURI: createRegistrySelector(
		( select ) => () => {
			const {
				getAdminURL,
				isWooCommerceActive,
				isGoogleForWooCommerceActive,
			} = select( CORE_SITE );

			const adminURL = getAdminURL();

			if ( ! adminURL ) {
				return undefined;
			}

			if (
				isWooCommerceActive() &&
				isGoogleForWooCommerceActive() === false
			) {
				return addQueryArgs( `${ adminURL }/plugin-install.php`, {
					s: 'google-listings-and-ads',
					tab: 'search',
					type: 'term',
				} );
			}

			if ( isWooCommerceActive() && isGoogleForWooCommerceActive() ) {
				const googleDashboardPath =
					encodeURIComponent( '/google/dashboard' );

				return `${ adminURL }/admin.php?page=wc-admin&path=${ googleDashboardPath }`;
			}

			return '';
		}
	),
};

const store = {
	selectors,
};

export default store;
