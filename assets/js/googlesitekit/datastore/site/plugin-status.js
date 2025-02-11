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

import { createRegistrySelector } from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { addQueryArgs } from '@wordpress/url';

function getPluginStatusProperty( propName, plugin ) {
	return createRegistrySelector( ( select ) => () => {
		const {
			getWooCommercePluginStatus,
			getGoogleForWooCommercePluginStatus,
		} = select( CORE_SITE );

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

			return undefined;
		}
	),
};

const store = {
	selectors,
};

export default store;
