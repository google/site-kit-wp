/**
 * `modules/analytics-4` data store: fresh data.
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
import { Select, createRegistrySelector } from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from './constants';

export const selectors = {
	/**
	 * Determines whether WooCommerce products should be included alongside
	 * WordPress posts for "Fresh Data" cards/widgets.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean|undefined)} `true` if WooCommerce products should be included, `false` if not. Returns `undefined` if not yet loaded.
	 */
	shouldIncludeWooCommerceProducts: createRegistrySelector(
		( select: Select ) => (): boolean | undefined => {
			if ( ! isFeatureEnabled( 'freshData' ) ) {
				return false;
			}

			const wooCommerceActive =
				select( CORE_SITE ).isWooCommerceActivated();
			const setting =
				select(
					MODULES_ANALYTICS_4
				).getFreshDataIncludesWooCommerceProducts();
			const analyticsConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);

			if (
				wooCommerceActive === undefined ||
				setting === undefined ||
				analyticsConnected === undefined
			) {
				return undefined;
			}

			return analyticsConnected && wooCommerceActive && setting === true;
		}
	),
};

export default {
	selectors,
};
