/**
 * Reader Revenue Manager Setup CTA Banner component.
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
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import Link from '@/js/components/Link';
import useRetriableNotificationDismissButtonLabel from '@/js/components/notifications/useRetriableNotificationDismissButtonLabel';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import SetupCTA from '@/js/googlesitekit/notifications/components/layout/SetupCTA';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import { useFeature } from '@/js/hooks/useFeature';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
import BannerExpressSetupSVGMobile from '@/svg/graphics/banner-rrm-express-setup-cta-mobile.svg?url';
import BannerExpressSetupSVGTablet from '@/svg/graphics/banner-rrm-express-setup-cta-tablet.svg?url';
import BannerExpressSetupSVGDesktop from '@/svg/graphics/banner-rrm-express-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-rrm-setup-cta-mobile.svg?url';
import BannerSVGDesktop from '@/svg/graphics/banner-rrm-setup-cta.svg?url';

export default function ReaderRevenueManagerSetupCTABanner( {
	id,
	Notification,
} ) {
	const rrmExpressSetupEnabled = useFeature( 'rrmExpressSetup' );
	const [ isSaving, setIsSaving ] = useState( false );

	const onSetupActivate = useActivateModuleCallback(
		MODULE_SLUG_READER_REVENUE_MANAGER
	);

	const onExpressSetupActivate = useActivateModuleCallback(
		MODULE_SLUG_READER_REVENUE_MANAGER,
		{
			redirectQueryArgs: {
				expressSetup: 'true',
				cta: 'newsletter-signup',
			},
		}
	);

	const onSetupCallback = useCallback( () => {
		setIsSaving( true );
		( rrmExpressSetupEnabled ? onExpressSetupActivate : onSetupActivate )();
	}, [
		onSetupActivate,
		onExpressSetupActivate,
		rrmExpressSetupEnabled,
		setIsSaving,
	] );

	const tooltipSettings = {
		tooltipSlug: 'rrm-setup-notification',
		content: __(
			'You can always enable Reader Revenue Manager in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const { triggerSurvey } = useDispatch( CORE_USER );

	const onExploreOtherFeaturesActivate = useActivateModuleCallback(
		MODULE_SLUG_READER_REVENUE_MANAGER
	);

	const onExploreOtherFeaturesCallback = useCallback(
		( event ) => {
			event.preventDefault();
			onExploreOtherFeaturesActivate();
		},
		[ onExploreOtherFeaturesActivate ]
	);

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);
	const dismissLabel = useRetriableNotificationDismissButtonLabel( {
		isDismissalFinal,
	} );

	useEffect( () => {
		triggerSurvey( 'view_reader_revenue_manager_cta' );
	}, [ triggerSurvey ] );

	if ( rrmExpressSetupEnabled ) {
		return (
			<Notification>
				<SetupCTA
					className="googlesitekit-rrm-setup-cta-banner"
					notificationID={ id }
					title={ __(
						'Turn casual visitors into loyal readers',
						'google-site-kit'
					) }
					description={ createInterpolateElement(
						__(
							'Add a simple signup form to your site to start building your email subscriber list, powered by Reader Revenue Manager. Want to do more? <link>Explore other features</link> like reader contributions, paywalls, or surveys.',
							'google-site-kit'
						),
						{
							link: (
								<Link
									href="#"
									onClick={ onExploreOtherFeaturesCallback }
									className="googlesitekit-rrm-setup-cta-banner__explore-link"
								/>
							),
						}
					) }
					ctaButton={ {
						label: __( 'Set up a sign-up form', 'google-site-kit' ),
						onClick: onSetupCallback,
						inProgress: isSaving,
						dismissOnClick: true,
						dismissOptions: {
							skipHidingFromQueue: true,
						},
					} }
					dismissButton={ {
						label: dismissLabel,
						onClick: showTooltip,
						dismissOptions: {
							expiresInSeconds: isDismissalFinal
								? 0
								: 2 * WEEK_IN_SECONDS,
						},
						disabled: isSaving,
					} }
					svg={ {
						desktop: BannerExpressSetupSVGDesktop,
						mobile: BannerExpressSetupSVGMobile,
						tablet: BannerExpressSetupSVGTablet,
						verticalPosition: 'center',
					} }
				/>
			</Notification>
		);
	}

	return (
		<Notification>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Grow your revenue and deepen reader engagement',
					'google-site-kit'
				) }
				description={ __(
					'Turn casual visitors into loyal readers and earn more from your content with paywalls, contributions, surveys, newsletter sign-ups and reader insight tools.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __(
						'Set up Reader Revenue Manager',
						'google-site-kit'
					),
					onClick: onSetupCallback,
					inProgress: isSaving,
					dismissOnClick: true,
					dismissOptions: {
						skipHidingFromQueue: true,
					},
				} }
				dismissButton={ {
					label: dismissLabel,
					onClick: showTooltip,
					dismissOptions: {
						expiresInSeconds: isDismissalFinal
							? 0
							: 2 * WEEK_IN_SECONDS,
					},
					disabled: isSaving,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'center',
				} }
				learnMoreLink={ {
					href: 'https://readerrevenue.withgoogle.com',
				} }
			/>
		</Notification>
	);
}

ReaderRevenueManagerSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
