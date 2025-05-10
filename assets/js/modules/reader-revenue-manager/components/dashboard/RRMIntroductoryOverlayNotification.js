/**
 * RRMIntroductoryOverlayNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ExternalIcon from '../../../../../svg/icons/external.svg';
import OverlayNotification from '../../../../googlesitekit/notifications/components/layout/OverlayNotification';
import ReaderRevenueManagerIntroductoryGraphicDesktop from '../../../../../svg/graphics/reader-revenue-manager-monetize-graphic-desktop.svg';
import ReaderRevenueManagerIntroductoryGraphicMobile from '../../../../../svg/graphics/reader-revenue-manager-monetize-graphic-mobile.svg';
import SupportLink from '../../../../components/SupportLink';
import { useSelect } from 'googlesitekit-data';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

export const RRM_INTRODUCTORY_OVERLAY_NOTIFICATION =
	'rrmIntroductoryOverlayNotification';

export default function RRMIntroductoryOverlayNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();

	const { publicationID, publicationOnboardingState, paymentOption } =
		useSelect(
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

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/news/publisher-center/answer/11449914',
		} )
	);

	const gaTrackingEventArgs = {
		category: `${ viewContext }_rrm-introductory-notification`,
		label: `${ publicationOnboardingState }:${ paymentOption || '' }`,
	};

	const handleLearnMoreClick = () => {
		trackEvent(
			gaTrackingEventArgs.category,
			'click_learn_more_link',
			gaTrackingEventArgs.label
		);
	};

	const title =
		paymentOption === 'noPayment'
			? __(
					'New! Monetize your content with Reader Revenue Manager',
					'google-site-kit'
			  )
			: __(
					'Complete account setup with Reader Revenue Manager',
					'google-site-kit'
			  );

	const description =
		paymentOption === 'noPayment'
			? createInterpolateElement(
					__(
						'Now you can offer your users subscription options to access content behind a paywall, or make voluntary contributions. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<SupportLink
								path="/news/publisher-center/answer/11449914"
								external
								hideExternalIndicator
								onClick={ handleLearnMoreClick }
							/>
						),
					}
			  )
			: __(
					'Easily monetize your content by offering users subscription options to access content behind a paywall, or make voluntary contributions.',
					'google-site-kit'
			  );

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<OverlayNotification
				notificationID={ id }
				title={ title }
				description={ description }
				ctaButton={ {
					label:
						paymentOption === 'noPayment'
							? __( 'Explore features', 'google-site-kit' )
							: __( 'Learn more', 'google-site-kit' ),
					href:
						paymentOption === 'noPayment' ? serviceURL : supportURL,
					target: '_blank',
					trailingIcon: <ExternalIcon width={ 13 } height={ 13 } />,
				} }
				dismissButton
				GraphicDesktop={
					ReaderRevenueManagerIntroductoryGraphicDesktop
				}
				GraphicMobile={ ReaderRevenueManagerIntroductoryGraphicMobile }
			/>
		</Notification>
	);
}
