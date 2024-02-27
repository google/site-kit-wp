/**
 * SubtleNotifications component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useViewOnly from '../../hooks/useViewOnly';
import GA4AdSenseLinkedNotification from './GA4AdSenseLinkedNotification';
import { useAnalyticsAdSenseIntegrationCheck } from '../../hooks/useAnalyticsAdSenseIntegrationCheck';
import { useFeature } from '../../hooks/useFeature';

export default function SubtleNotifications() {
	const viewOnly = useViewOnly();

	const isGA4AdSenseIntegrationEnabled = useFeature(
		'ga4AdSenseIntegration'
	);
	const ga4AdSenseIntegration = useAnalyticsAdSenseIntegrationCheck();
	const renderGA4AdSenseLinkedNotification =
		ga4AdSenseIntegration.connected &&
		ga4AdSenseIntegration.linked &&
		isGA4AdSenseIntegrationEnabled;

	if ( viewOnly ) {
		return null;
	}

	return (
		<Fragment>
			{ renderGA4AdSenseLinkedNotification && (
				<GA4AdSenseLinkedNotification />
			) }
		</Fragment>
	);
}
