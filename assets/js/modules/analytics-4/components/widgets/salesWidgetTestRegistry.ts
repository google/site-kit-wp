/**
 * Shared test registry setup for the "Selling products" Key Metrics widgets.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { provideKeyMetrics, provideModules } from '@tests/js/utils';

/**
 * Configures a test registry with a connected Analytics-4 module, Key
 * Metrics settings, and a detected "purchase" conversion event.
 *
 * Shared setup for the "Selling products" Key Metrics widget tests
 * (SalesRateWidget, TotalSalesWidget, TopPagesDrivingSalesWidget, etc).
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Data registry to configure.
 * @return {void}
 */
export function provideSalesWidgetTestRegistry(
	registry: WPDataRegistry
): void {
	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	provideKeyMetrics( registry );
	provideModules(
		registry,
		withConnected( MODULE_SLUG_ANALYTICS_4 ) as Parameters<
			typeof provideModules
		>[ 1 ]
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
}
