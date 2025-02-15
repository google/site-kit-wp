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
import { Button } from 'googlesitekit-components';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import OverlayNotification from '../../../../components/OverlayNotification/OverlayNotification';
import ReaderRevenueManagerIntroductoryGraphicDesktop from '../../../../../svg/graphics/reader-revenue-manager-monetize-graphic-desktop.svg';
import ReaderRevenueManagerIntroductoryGraphicMobile from '../../../../../svg/graphics/reader-revenue-manager-monetize-graphic-mobile.svg';
import SupportLink from '../../../../components/SupportLink';
import useDashboardType from '../../../../hooks/useDashboardType';
import { useSelect, useDispatch } from 'googlesitekit-data';
import useViewOnly from '../../../../hooks/useViewOnly';
import whenActive from '../../../../util/when-active';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

const { ONBOARDING_COMPLETE } = PUBLICATION_ONBOARDING_STATES;

export const RRM_INTRODUCTORY_OVERLAY_NOTIFICATION =
	'rrmIntroductoryOverlayNotification';

function RRMIntroductoryOverlayNotification() {
	const isViewOnly = useViewOnly();
	const dashboardType = useDashboardType();

	const { publicationID, publicationOnboardingState, paymentOption } =
		useSelect(
			( select ) =>
				select( MODULES_READER_REVENUE_MANAGER ).getSettings() || {}
		);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			RRM_INTRODUCTORY_OVERLAY_NOTIFICATION
		)
	);

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			RRM_INTRODUCTORY_OVERLAY_NOTIFICATION
		)
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

	const { dismissOverlayNotification } = useDispatch( CORE_UI );

	const shouldShowNotification =
		isDismissed === false &&
		! isViewOnly &&
		dashboardType === VIEW_CONTEXT_MAIN_DASHBOARD &&
		publicationOnboardingState === ONBOARDING_COMPLETE &&
		[ 'noPayment', '' ].includes( paymentOption );

	const dismissNotice = () => {
		dismissOverlayNotification( RRM_INTRODUCTORY_OVERLAY_NOTIFICATION );
	};

	return (
		<OverlayNotification
			className="googlesitekit-reader-revenue-manager-overlay-notification googlesitekit-reader-revenue-manager-introductory-notification"
			GraphicDesktop={ ReaderRevenueManagerIntroductoryGraphicDesktop }
			GraphicMobile={ ReaderRevenueManagerIntroductoryGraphicMobile }
			shouldShowNotification={ shouldShowNotification }
			notificationID={ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION }
		>
			<div className="googlesitekit-overlay-notification__body">
				<h3>
					{ paymentOption === 'noPayment'
						? __(
								'New! Monetize your content with Reader Revenue Manager',
								'google-site-kit'
						  )
						: __(
								'Complete account setup with Reader Revenue Manager',
								'google-site-kit'
						  ) }
				</h3>
				<p>
					{ paymentOption === 'noPayment'
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
										/>
									),
								}
						  )
						: __(
								'Easily monetize your content by offering users subscription options to access content behind a paywall, or make voluntary contributions.',
								'google-site-kit'
						  ) }
				</p>
			</div>
			<div className="googlesitekit-overlay-notification__actions">
				<Button
					tertiary
					disabled={ isDismissing }
					onClick={ dismissNotice }
				>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>

				<Button
					disabled={ isDismissing }
					href={
						paymentOption === 'noPayment' ? serviceURL : supportURL
					}
					onClick={ dismissNotice }
					trailingIcon={ <ExternalIcon width={ 13 } height={ 13 } /> }
					target="_blank"
				>
					{ paymentOption === 'noPayment'
						? __( 'Explore features', 'google-site-kit' )
						: __( 'Learn more', 'google-site-kit' ) }
				</Button>
			</div>
		</OverlayNotification>
	);
}

export default whenActive( { moduleName: READER_REVENUE_MANAGER_MODULE_SLUG } )(
	RRMIntroductoryOverlayNotification
);
