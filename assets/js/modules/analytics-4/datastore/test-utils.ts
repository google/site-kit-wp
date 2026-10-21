/**
 * `modules/analytics-4` datastore test utilities.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from './constants';
import { RecentContentItem, RecentContentOptions } from './fresh-data';

/**
 * Stores the recently published posts for `getRecentContent( options )` and
 * marks it as resolved, so it renders without a request.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object}   registry      Data registry object.
 * @param {Object[]} recentContent The posts and products, newest first.
 * @param {Object}   options       The options passed to `getRecentContent()`.
 * @return {void}
 */
export function provideRecentContent(
	registry: WPDataRegistry,
	recentContent: RecentContentItem[],
	options: RecentContentOptions
) {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetRecentContent( recentContent, {
			...options,
			includeProducts: false,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getRecentContent', [ options ] );
}

/**
 * Puts the module list, the site info, and the Analytics settings in the
 * store. The selectors that decide whether to include products read them.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object}  registry                          The registry to put the state in.
 * @param {Object}  [state]                           Optional. The state to put in the store.
 * @param {boolean} [state.analyticsConnected]        Optional. Whether Analytics is connected. Default `true`.
 * @param {boolean} [state.wooCommerceActive]         Optional. Whether WooCommerce is active. Default `true`.
 * @param {boolean} [state.setting]                   Optional. Whether the setting to include products is on. Default `true`.
 * @param {string}  [state.productPostType]           Optional. The product post type. Default `product`.
 * @param {string}  [state.productPathPrefix]         Optional. The path that product URLs start with. Default `null`.
 * @param {string}  [state.productQueryVar]           Optional. The query var of the product post type, or `null` for none. Default `product`.
 * @param {boolean} [state.usingPlainPermalinks]      Optional. Whether the site uses plain permalinks. Default `false`.
 * @param {Array}   [state.availableCustomDimensions] Optional. The custom dimensions that the Analytics property has, or `null` when they haven't been synced. Default `undefined`, which the store reads as not loaded yet.
 * @return {void}
 */
export function provideIncludeProductsState(
	registry: WPDataRegistry,
	{
		analyticsConnected = true,
		wooCommerceActive = true,
		setting = true,
		productPostType = 'product',
		productPathPrefix = null,
		productQueryVar = 'product',
		usingPlainPermalinks = false,
		availableCustomDimensions,
	}: {
		analyticsConnected?: boolean;
		wooCommerceActive?: boolean;
		setting?: boolean;
		productPostType?: string | null;
		productPathPrefix?: string | null;
		productQueryVar?: string | null;
		usingPlainPermalinks?: boolean;
		availableCustomDimensions?: string[] | null;
	} = {}
) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: analyticsConnected,
		},
	] );

	provideSiteInfo( registry, {
		wooCommerceActive,
		productPostType,
		productPathPrefix,
		productQueryVar,
		usingPlainPermalinks,
	} );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
		[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: setting,
		availableCustomDimensions,
	} );
}
