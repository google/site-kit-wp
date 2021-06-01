/**
 * Analytics-4 module initialization.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isFeatureEnabled } from '../../features';

export { registerStore } from './datastore';

if ( isFeatureEnabled( 'ga4setup' ) ) {
	addFilter(
		'googlesitekit.SetupWinNotification-analytics',
		'googlesitekit.OptimizeSetupWinNotification',
		( winData ) => {
			winData.description = __( 'You’ll only see Universal Analytics data for now.', 'google-site-kit' );
			winData.learnMore.label = 'Learn more';
			winData.learnMore.url = 'https://sitekit.withgoogle.com/documentation/ga4-analytics-property/';
			return winData;
		}
	);
}
