/**
 * PublicationApprovedOverlayNotification component.
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
import OverlayNotification from '../../../../components/OverlayNotification/OverlayNotification';
import ReaderRevenueManagerIntroductoryGraphicDesktop from '../../../../../svg/graphics/reader-revenue-manager-introductory-graphic-desktop.svg';
import ReaderRevenueManagerIntroductoryGraphicMobile from '../../../../../svg/graphics/reader-revenue-manager-introductory-graphic-mobile.svg';
import useViewOnly from '../../../../hooks/useViewOnly';
import useDashboardType from '../../../../hooks/useDashboardType';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import { Button } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
} from '../../datastore/constants';

export const RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION =
	'rrmPublicationApprovedOverlayNotification';

export default function PublicationApprovedOverlayNotification() {
	const isViewOnly = useViewOnly();
	const dashboardType = useDashboardType();

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION
		)
	);

	const { dismissOverlayNotification } = useDispatch( CORE_UI );
	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL()
	);

	const showApprovedNotificationUI = useSelect( ( select ) =>
		select( CORE_UI ).getValue(
			UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
		)
	);

	/**
	 * Determines whether the publication approved notification should be shown when the following conditions are met.
	 * - The notification has not been dismissed.
	 * - The notification UI is enabled.
	 * - The user is not in view-only mode.
	 * - The user is on the main dashboard.
	 */
	const shouldShowNotification =
		isDismissed === false &&
		showApprovedNotificationUI === true &&
		! isViewOnly &&
		dashboardType === VIEW_CONTEXT_MAIN_DASHBOARD;

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION
		)
	);

	const dismissNotification = () => {
		// Dismiss the notification, which also dismisses it from
		// the current user's profile with the `dismissItem` action.
		dismissOverlayNotification(
			RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION
		);
	};

	return (
		<OverlayNotification
			className="googlesitekit-reader-revenue-manager-publication-approved-notification"
			GraphicDesktop={ ReaderRevenueManagerIntroductoryGraphicDesktop }
			GraphicMobile={ ReaderRevenueManagerIntroductoryGraphicMobile }
			shouldShowNotification={ shouldShowNotification }
			notificationID={ RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION }
		>
			<div className="googlesitekit-overlay-notification__body">
				<h3>
					{ __(
						'Your Reader Revenue Manager publication is approved',
						'google-site-kit'
					) }
				</h3>
				<p>
					{ __(
						'Unlock your full reader opportunity by enabling features like subscriptions, contributions and newsletter sign ups',
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
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>

				<Button
					disabled={ isDismissing }
					href={ serviceURL }
					trailingIcon={ <ExternalIcon width={ 13 } height={ 13 } /> }
					target="_blank"
				>
					{ __( 'Enable features', 'google-site-kit' ) }
				</Button>
			</div>
		</OverlayNotification>
	);
}
