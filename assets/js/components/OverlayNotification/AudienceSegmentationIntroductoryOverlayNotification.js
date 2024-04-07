/**
 * AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import AudienceIntroductoryGraphicDesktop from '../../../svg/graphics/audience-segmentation-introductory-graphic-desktop.svg';
import AudienceIntroductoryGraphicMobile from '../../../svg/graphics/audience-segmentation-introductory-graphic-mobile.svg';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
import OverlayNotification from './OverlayNotification';

const { useSelect, useDispatch } = Data;

export const AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION =
	'audienceSegmentationIntroductoryOverlayNotification';

export default function AudienceSegmentationIntroductoryOverlayNotification() {
	const audienceSegmentationEnabled = useFeature( 'audienceSegmentation' );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
		)
	);

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
		)
	);

	const { dismissOverlayNotification } = useDispatch( CORE_UI );

	const dismissNotification = () => {
		// Dismiss the notification, which also dismisses it from
		// the current user's profile with the `dismissItem` action.
		dismissOverlayNotification(
			AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
		);
	};

	const shouldShowNotification =
		audienceSegmentationEnabled && isDismissed === false;

	return (
		<OverlayNotification
			shouldShowNotification={ shouldShowNotification }
			GraphicDesktop={ AudienceIntroductoryGraphicDesktop }
			GraphicMobile={ AudienceIntroductoryGraphicMobile }
			notificationID={
				AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
			}
		>
			<div className="googlesitekit-overlay-notification__body">
				<h3>{ __( 'New! Visitor groups', 'google-site-kit' ) }</h3>
				<p>
					{ __(
						'You can now learn more about your site visitor groups by comparing different metrics',
						'google-site-kit'
					) }
				</p>
			</div>

			<div className="googlesitekit-overlay-notification__actions">
				<Button
					tertiary
					disabled={ isDismissing }
					onClick={ dismissNotification }
				>
					{ __( 'Got it', 'google-site-kit' ) }
				</Button>

				<Button
					disabled={ isDismissing }
					onClick={ dismissNotification }
				>
					{ __( 'Show me', 'google-site-kit' ) }
				</Button>
			</div>
		</OverlayNotification>
	);
}
