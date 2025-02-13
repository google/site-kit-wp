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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OverlayNotification from '../../../../components/OverlayNotification/OverlayNotification';
import ReaderRevenueManagerIntroductoryGraphicDesktop from '../../../../../svg/graphics/reader-revenue-manager-monetize-graphic-desktop.svg';
import ReaderRevenueManagerIntroductoryGraphicMobile from '../../../../../svg/graphics/reader-revenue-manager-monetize-graphic-mobile.svg';
import useViewOnly from '../../../../hooks/useViewOnly';
import useViewContext from '../../../../hooks/useViewContext';
import useDashboardType from '../../../../hooks/useDashboardType';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import { trackEvent } from '../../../../util';
import { Button } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import whenActive from '../../../../util/when-active';
import { createInterpolateElement } from '@wordpress/element';
import SupportLink from '../../../../components/SupportLink';

const { ONBOARDING_COMPLETE } = PUBLICATION_ONBOARDING_STATES;

export const RRM_MONETIZATION_OVERLAY_NOTIFICATION =
	'rrmMonetizationOverlayNotification';

function RRMIntroductoryOverlayNotification() {
	const viewContext = useViewContext();
	const isViewOnly = useViewOnly();
	const dashboardType = useDashboardType();

	const { publicationID, publicationOnboardingState, paymentOption } =
		useSelect(
			( select ) =>
				select( MODULES_READER_REVENUE_MANAGER ).getSettings() || {}
		);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			RRM_MONETIZATION_OVERLAY_NOTIFICATION
		)
	);

	const { dismissOverlayNotification } = useDispatch( CORE_UI );

	const usingNonMonetaryCTA =
		paymentOption === '' || paymentOption === 'noPayment';

	const shouldShowNotification =
		isDismissed === false &&
		! isViewOnly &&
		dashboardType === VIEW_CONTEXT_MAIN_DASHBOARD &&
		publicationOnboardingState === ONBOARDING_COMPLETE &&
		usingNonMonetaryCTA;

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			RRM_MONETIZATION_OVERLAY_NOTIFICATION
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

	const dismissNotice = () => {
		dismissOverlayNotification( RRM_MONETIZATION_OVERLAY_NOTIFICATION );
	};

	const dismissNotification = () => {
		trackEvent(
			`${ viewContext }_rrm-monetization-notification`,
			'dismiss_notification'
		).finally( () => {
			dismissNotice();
		} );
	};

	return (
		<OverlayNotification
			className="googlesitekit-reader-revenue-manager-overlay-notification googlesitekit-reader-revenue-manager-monetization-notification"
			GraphicDesktop={ ReaderRevenueManagerIntroductoryGraphicDesktop }
			GraphicMobile={ ReaderRevenueManagerIntroductoryGraphicMobile }
			onShow={ () => {
				trackEvent(
					`${ viewContext }_rrm-monetization-notification`,
					'view_notification'
				);
			} }
			shouldShowNotification={ shouldShowNotification }
			notificationID={ RRM_MONETIZATION_OVERLAY_NOTIFICATION }
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
									'Now, you can offer your users subscription options to access content behind a paywall, or make voluntary contributions. <a>Learn more.</a>',
									'google-site-kit'
								),
								{
									a: (
										<SupportLink
											path="/news/publisher-center/answer/11449914"
											external
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
					onClick={ dismissNotification }
				>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>

				<Button
					disabled={ isDismissing }
					href={ serviceURL }
					onClick={ () => {
						trackEvent(
							`${ viewContext }_rrm-monetization-notification`,
							'confirm_notification'
						).finally( () => {
							dismissNotice();
						} );
					} }
					trailingIcon={ <ExternalIcon width={ 13 } height={ 13 } /> }
					target="_blank"
				>
					{ __( 'Explore features', 'google-site-kit' ) }
				</Button>
			</div>
		</OverlayNotification>
	);
}

export default whenActive( { moduleName: READER_REVENUE_MANAGER_MODULE_SLUG } )(
	RRMIntroductoryOverlayNotification
);
