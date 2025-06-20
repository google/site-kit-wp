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

/*
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import AudienceIntroductoryGraphicDesktop from '../../../../../../svg/graphics/audience-segmentation-introductory-graphic-desktop.svg';
import AudienceIntroductoryGraphicMobile from '../../../../../../svg/graphics/audience-segmentation-introductory-graphic-mobile.svg';
import OverlayNotification from '../../../../../googlesitekit/notifications/components/layout/OverlayNotification';
import { getNavigationalScrollTop } from '../../../../../util/scroll';
import { useBreakpoint } from '../../../../../hooks/useBreakpoint';
import { CORE_NOTIFICATIONS } from '../../../../../googlesitekit/notifications/datastore/constants';
import useViewContext from '../../../../../hooks/useViewContext';

export const AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION =
	'audienceSegmentationIntroductoryOverlayNotification';

export default function AudienceSegmentationIntroductoryOverlayNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

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

		dismissNotification( id );
	};

	const gaTrackingEventArgs = {
		category: `${ viewContext }_audiences-secondary-user-intro`,
	};

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<OverlayNotification
				notificationID={ id }
				title={ __( 'New! Visitor groups', 'google-site-kit' ) }
				description={ __(
					'You can now learn more about your site visitor groups by comparing different metrics.',
					'google-site-kit'
				) }
				GraphicDesktop={ AudienceIntroductoryGraphicDesktop }
				GraphicMobile={ AudienceIntroductoryGraphicMobile }
				ctaButton={ {
					label: __( 'Show me', 'google-site-kit' ),
					onClick: scrollToWidgetAndDismissNotification,
				} }
				dismissButton={ { label: __( 'Got it', 'google-site-kit' ) } }
				gaTrackingEventArgs={ gaTrackingEventArgs }
			/>
		</Notification>
	);
}

AudienceSegmentationIntroductoryOverlayNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
