/**
 * Ads module data requirements.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Registry } from 'googlesitekit-data';
import { MODULES_ADS } from '@/js/modules/ads/datastore/constants';

/**
 * A composable requirement check, as consumed by a notification's
 * `checkRequirements` callback.
 */
type DataRequirement = ( registry: Registry ) => Promise< boolean >;

/**
 * Returns a function that checks if the WooCommerce plugin is activated.
 *
 * The plugin status is tri-state: it is `undefined` until the module data has
 * been fetched, which does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(Registry): Promise<boolean>} Whether the WooCommerce plugin is activated or not.
 */
export function requireWooCommerceActivated(): DataRequirement {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ADS ).getModuleData();

		return true === select( MODULES_ADS ).isWooCommerceActivated();
	};
}

/**
 * Returns a function that checks if the Google for WooCommerce plugin is activated.
 *
 * The plugin status is tri-state: it is `undefined` until the module data has
 * been fetched, which does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(Registry): Promise<boolean>} Whether the Google for WooCommerce plugin is activated or not.
 */
export function requireGoogleForWooCommerceActivated(): DataRequirement {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ADS ).getModuleData();

		return true === select( MODULES_ADS ).isGoogleForWooCommerceActivated();
	};
}

/**
 * Returns a function that checks if the Google for WooCommerce plugin has a linked Ads account.
 *
 * The account status is tri-state: it is `undefined` until the module data has
 * been fetched, which does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(Registry): Promise<boolean>} Whether a Google for WooCommerce Ads account is present or not.
 */
export function requireGoogleForWooCommerceAdsAccount(): DataRequirement {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ADS ).getModuleData();

		return (
			true === select( MODULES_ADS ).hasGoogleForWooCommerceAdsAccount()
		);
	};
}

/**
 * Returns a function that checks if the Google for WooCommerce plugin has no linked Ads account.
 *
 * The account status is tri-state: it is `undefined` until the module data has
 * been fetched, which does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(Registry): Promise<boolean>} Whether the Google for WooCommerce Ads account is absent or not.
 */
export function requireNoGoogleForWooCommerceAdsAccount(): DataRequirement {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ADS ).getModuleData();

		return (
			false === select( MODULES_ADS ).hasGoogleForWooCommerceAdsAccount()
		);
	};
}
