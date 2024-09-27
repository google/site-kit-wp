/**
 * AudienceSegmentationIntroductoryOverlayNotification component.
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
import { useSelect, useDispatch } from 'googlesitekit-data';
import AudienceIntroductoryGraphicDesktop from '../../../../../../svg/graphics/audience-segmentation-introductory-graphic-desktop.svg';
import AudienceIntroductoryGraphicMobile from '../../../../../../svg/graphics/audience-segmentation-introductory-graphic-mobile.svg';
import OverlayNotification from '../../../../../components/OverlayNotification/OverlayNotification';
import { getNavigationalScrollTop } from '../../../../../util/scroll';
import { useBreakpoint } from '../../../../../hooks/useBreakpoint';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import useViewOnly from '../../../../../hooks/useViewOnly';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../../../../hooks/useDashboardType';

export const AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION =
	'audienceSegmentationIntroductoryOverlayNotification';

export default function AudienceSegmentationIntroductoryOverlayNotification() {
	const isViewOnly = useViewOnly();
	const breakpoint = useBreakpoint();
	const dashboardType = useDashboardType();

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

	const shouldShowAudienceSegmentationIntroductoryOverlay = useSelect(
		( select ) => {
			const isModuleActive =
				select( CORE_MODULES ).isModuleActive( 'analytics-4' );
			const canViewModule =
				! isViewOnly ||
				select( CORE_USER ).canViewSharedModule( 'analytics-4' );
			const audienceSegmentationSetupCompletedBy =
				select(
					MODULES_ANALYTICS_4
				).getAudienceSegmentationSetupCompletedBy();
			const userID = select( CORE_USER ).getID();
			return (
				isModuleActive &&
				canViewModule &&
				Number.isInteger( audienceSegmentationSetupCompletedBy ) &&
				audienceSegmentationSetupCompletedBy !== userID
			);
		}
	);

	const { dismissOverlayNotification } = useDispatch( CORE_UI );

	const dismissNotification = () => {
		// Dismiss the notification, which also dismisses it from
		// the current user's profile with the `dismissItem` action.
		dismissOverlayNotification(
			AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
		);
	};

	const scrollToWidgetAndDismissNotification = ( event ) => {
		event.preventDefault();

		const widgetAreaClass =
			'.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation';

		setTimeout( () => {
			global.scrollTo( {
				top: getNavigationalScrollTop( widgetAreaClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 0 );

		dismissNotification();
	};

	const shouldShowNotification =
		isDismissed === false &&
		shouldShowAudienceSegmentationIntroductoryOverlay &&
		DASHBOARD_TYPE_MAIN === dashboardType;

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
					onClick={ scrollToWidgetAndDismissNotification }
				>
					{ __( 'Show me', 'google-site-kit' ) }
				</Button>
			</div>
		</OverlayNotification>
	);
}
