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
import { useSelect } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '../../modules/reader-revenue-manager/datastore/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

export default function OverlayNotificationsRenderer() {
	const audienceSegmentationEnabled = useFeature( 'audienceSegmentation' );
	const readerRevenueManagerEnabled = useFeature( 'rrmModule' );
	const analyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'modules/analytics-4' )
	);
	const rrmConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected(
			MODULES_READER_REVENUE_MANAGER
		)
	);

	return (
		<Fragment>
			<LinkAnalyticsAndAdSenseAccountsOverlayNotification />
			<AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification />
			{ analyticsConnected && audienceSegmentationEnabled && (
				<AudienceSegmentationIntroductoryOverlayNotification />
			) }
			{ rrmConnected && readerRevenueManagerEnabled && (
				<PublicationApprovedOverlayNotification />
			) }
		</Fragment>
	);
}
