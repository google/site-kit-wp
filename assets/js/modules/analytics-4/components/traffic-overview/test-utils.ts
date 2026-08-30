/**
 * Traffic Overview test utility functions.
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
import { PERMISSION_READ_SHARED_MODULE_DATA } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { provideUserCapabilities } from '@tests/js/utils';

/** The capability a view-only user's role needs to read Analytics data. */
const VIEW_ANALYTICS_CAPABILITY = `${ PERMISSION_READ_SHARED_MODULE_DATA }::["${ MODULE_SLUG_ANALYTICS_4 }"]`;

/**
 * Gives a view-only user's role the capability to read Analytics data.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The test registry the code under test reads from.
 * @return {void}
 */
export function allowAnalyticsAccess( registry: WPDataRegistry ) {
	provideUserCapabilities( registry, {
		[ VIEW_ANALYTICS_CAPABILITY ]: true,
	} );
}

/**
 * Takes the capability to read Analytics data away from a view-only user's role.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The test registry the code under test reads from.
 * @return {void}
 */
export function denyAnalyticsAccess( registry: WPDataRegistry ) {
	provideUserCapabilities( registry, {
		[ VIEW_ANALYTICS_CAPABILITY ]: false,
	} );
}
