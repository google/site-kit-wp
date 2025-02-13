/**
 * OverlayNotificationsRenderer component.
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
import { useFeature } from '../../hooks/useFeature';
import AudienceSegmentationIntroductoryOverlayNotification from '../../modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationIntroductoryOverlayNotification';
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification from './AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
import LinkAnalyticsAndAdSenseAccountsOverlayNotification from './LinkAnalyticsAndAdSenseAccountsOverlayNotification';
import { PublicationApprovedOverlayNotification } from '../../modules/reader-revenue-manager/components/dashboard';
import RRMIntroductoryOverlayNotification from '../../modules/reader-revenue-manager/components/dashboard/RRMIntroductoryOverlayNotification';

export default function OverlayNotificationsRenderer() {
	const audienceSegmentationEnabled = useFeature( 'audienceSegmentation' );
	const readerRevenueManagerEnabled = useFeature( 'rrmModule' );
	const readerRevenueManagerV2Enabled = useFeature( 'rrmModuleV2' );

	return (
		<Fragment>
			<LinkAnalyticsAndAdSenseAccountsOverlayNotification />
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />
			{ audienceSegmentationEnabled && (
				<AudienceSegmentationIntroductoryOverlayNotification />
			) }
			{ readerRevenueManagerEnabled && (
				<PublicationApprovedOverlayNotification />
			) }
			{ readerRevenueManagerV2Enabled && (
				<RRMIntroductoryOverlayNotification />
			) }
		</Fragment>
	);
}
