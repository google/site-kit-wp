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
import OverlayNotification from '@/js/googlesitekit/notifications/components/layout/OverlayNotification';
import ReaderRevenueManagerIntroductoryGraphicDesktop from '@/svg/graphics/reader-revenue-manager-introductory-graphic-desktop.svg';
import ReaderRevenueManagerIntroductoryGraphicMobile from '@/svg/graphics/reader-revenue-manager-introductory-graphic-mobile.svg';
import useViewContext from '@/js/hooks/useViewContext';
import ExternalIcon from '@/svg/icons/external.svg';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

export const RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION =
	'rrmPublicationApprovedOverlayNotification';

export default function PublicationApprovedOverlayNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();

	const { publicationID } = useSelect(
		( select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getSettings() || {}
	);

	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
			path: 'reader-revenue-manager',
			query: {
				publication: publicationID,
			},
		} )
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const gaTrackingEventArgs = {
		category: `${ viewContext }_rrm-publication-approved-notification`,
	};

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<OverlayNotification
				notificationID={ id }
				title={ __(
					'Your Reader Revenue Manager publication is approved',
					'google-site-kit'
				) }
				description={ __(
					'Unlock your full reader opportunity by enabling features like paywall, subscriptions, contributions and newsletter sign ups.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Enable features', 'google-site-kit' ),
					href: serviceURL,
					onClick: () => dismissNotification( id ),
					target: '_blank',
					trailingIcon: <ExternalIcon width={ 13 } height={ 13 } />,
				} }
				GraphicDesktop={
					ReaderRevenueManagerIntroductoryGraphicDesktop
				}
				GraphicMobile={ ReaderRevenueManagerIntroductoryGraphicMobile }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				dismissButton
			/>
		</Notification>
	);
}

PublicationApprovedOverlayNotification.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
