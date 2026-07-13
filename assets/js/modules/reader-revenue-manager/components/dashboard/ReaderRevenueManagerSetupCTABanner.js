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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import useRetriableNotificationDismissButtonLabel from '@/js/components/notifications/useRetriableNotificationDismissButtonLabel';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
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

	const onSetupCallback = useCallback( () => {
		setIsSaving( true );
		onSetupActivate();
	}, [ onSetupActivate, setIsSaving ] );

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
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const expressSetupURL = useSelect( ( select ) => {
		const adminURL = select( CORE_SITE ).getAdminURL(
			'googlesitekit-dashboard',
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				reAuth: true,
			}
		);

		if ( ! adminURL ) {
			return null;
		}

		return addQueryArgs( adminURL, {
			expressSetup: true,
			cta: 'newsletter',
		} );
	} );

	const existingSetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			reAuth: true,
		} )
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

	const onExpressSetupCallback = useCallback( () => {
		setIsSaving( true );
		if ( expressSetupURL ) {
			navigateTo( expressSetupURL );
		}
	}, [ expressSetupURL, navigateTo ] );

	const title = rrmExpressSetupEnabled
		? __( 'Turn casual visitors into loyal readers', 'google-site-kit' )
		: __(
				'Grow your revenue and deepen reader engagement',
				'google-site-kit'
		  );

	const description = rrmExpressSetupEnabled
		? createInterpolateElement(
				__(
					'Add a simple signup form to your site to start building your email subscriber list, powered by Reader Revenue Manager. Want to do more? <link>Explore other features</link> like reader contributions, paywalls, or surveys.',
					'google-site-kit'
				),
				{
					link: (
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						<a
							href={ existingSetupURL ?? '' }
							className="googlesitekit-banner__description_link"
						/>
					),
				}
		  )
		: __(
				'Turn casual visitors into loyal readers and earn more from your content with paywalls, contributions, surveys, newsletter sign-ups and reader insight tools.',
				'google-site-kit'
		  );

	return (
		<Notification>
			<SetupCTA
				notificationID={ id }
				title={ title }
				description={ description }
				ctaButton={ {
					label: rrmExpressSetupEnabled
						? __( 'Set up a sign-up form', 'google-site-kit' )
						: __(
								'Set up Reader Revenue Manager',
								'google-site-kit'
						  ),
					onClick: rrmExpressSetupEnabled
						? onExpressSetupCallback
						: onSetupCallback,
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
					desktop: rrmExpressSetupEnabled
						? BannerExpressSetupSVGDesktop
						: BannerSVGDesktop,
					mobile: rrmExpressSetupEnabled
						? BannerExpressSetupSVGMobile
						: BannerSVGMobile,
					tablet: rrmExpressSetupEnabled
						? BannerExpressSetupSVGTablet
						: undefined,
					verticalPosition: 'center',
				} }
				learnMoreLink={
					rrmExpressSetupEnabled
						? undefined
						: {
								href: 'https://readerrevenue.withgoogle.com',
						  }
				}
			/>
		</Notification>
	);
}

ReaderRevenueManagerSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
