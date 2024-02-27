/**
 * `useAnalyticsAdSenseIntegrationCheck` hook.
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
 * WordPress dependencies
 */
// Imported directly from `@wordpress/data` to avoid circular
// dependency/imports.
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';

/**
 * Checks if both Analytics 4 and AdSense modules are connected and linked.
 *
 * Needed for checks related to GA4 + AdSense integration
 * logic, which requires checks that both modules are connected and linked.
 *
 * @since n.e.x.t
 *
 * @return {boolean} TRUE if both modules are connected, otherwise FALSE.
 */
export function useAnalyticsAdSenseIntegrationCheck() {
	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'adsense' )
	);
	const AnalyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const isAdSenseLinked = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdSenseLinked()
	);

	return {
		connected: adSenseModuleConnected && AnalyticsModuleConnected,
		linked: isAdSenseLinked,
	};
}
