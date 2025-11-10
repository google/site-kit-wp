/**
 * AdsModuleSetupCTABanner component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS, MINUTE_IN_SECONDS, WEEK_IN_SECONDS } from '@/js/util';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
	MODULES_ADS,
} from '@/js/modules/ads/datastore/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import { WooCommerceRedirectModal } from '@/js/modules/ads/components/common';
import AdBlockerWarning from '@/js/components/notifications/AdBlockerWarning';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import SetupCTA from '@/js/googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVGDesktop from '@/svg/graphics/banner-ads-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-ads-setup-cta-mobile.svg?url';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import SurveyViewTrigger from '@/js/components/surveys/SurveyViewTrigger';

export default function AdsModuleSetupCTABanner( { id, Notification } ) {
	const [ openDialog, setOpenDialog ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );

	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'set-up-ads' )
	);

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	const shouldShowWooCommerceRedirectModal = useSelect( ( select ) => {
		const {
			isWooCommerceActivated,
			isGoogleForWooCommerceActivated,
			hasGoogleForWooCommerceAdsAccount,
		} = select( MODULES_ADS );

		return (
			( isWooCommerceActivated() &&
				isGoogleForWooCommerceActivated() &&
				! hasGoogleForWooCommerceAdsAccount() ) ||
			( isWooCommerceActivated() && ! isGoogleForWooCommerceActivated() )
		);
	} );

	const isWooCommerceRedirectModalDismissed = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceRedirectModalDismissed()
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const { setCacheItem } = useDispatch( CORE_SITE );
	const dismissWooCommerceRedirectModal = useCallback( () => {
		setCacheItem( ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY, true, {
			ttl: 5 * MINUTE_IN_SECONDS,
		} );
	}, [ setCacheItem ] );

	const activateModule = useActivateModuleCallback( MODULE_SLUG_ADS );

	const { triggerSurvey } = useDispatch( CORE_USER );

	const onSetupCallback = useCallback( () => {
		triggerSurvey( 'accept_ads_setup_cta' );

		if (
			! shouldShowWooCommerceRedirectModal ||
			isWooCommerceRedirectModalDismissed
		) {
			setIsSaving( true );
			activateModule();
			return;
		}

		setOpenDialog( true );
	}, [
		triggerSurvey,
		shouldShowWooCommerceRedirectModal,
		activateModule,
		isWooCommerceRedirectModalDismissed,
	] );

	const onModalClose = useCallback( () => {
		setOpenDialog( false );
	}, [ setOpenDialog ] );

	const tooltipSettings = {
		tooltipSlug: 'ads-setup-notification',
		content: __(
			'You can always enable Ads in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const [ dismissLabel, setDismissLabel ] = useState(
		__( 'Maybe later', 'google-site-kit' )
	);

	useMount( () => {
		if ( true === isDismissalFinal ) {
			setDismissLabel( __( 'Don’t show again', 'google-site-kit' ) );
		}
	} );

	return (
		<Notification>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Get better quality leads and enhance conversions with Ads',
					'google-site-kit'
				) }
				description={
					<Fragment>
						{ createInterpolateElement(
							__(
								'Help drive sales, leads, or site traffic by getting your business in front of people who are actively searching Google for products or services you offer. <a />',
								'google-site-kit'
							),
							{
								a: (
									<LearnMoreLink
										id={ id }
										label={ __(
											'Learn more',
											'google-site-kit'
										) }
										url={ learnMoreURL }
									/>
								),
							}
						) }
						{ isAdBlockerActive && (
							<AdBlockerWarning moduleSlug="ads" />
						) }
					</Fragment>
				}
				ctaButton={ {
					label: __( 'Set up Ads', 'google-site-kit' ),
					onClick: onSetupCallback,
					disabled: isAdBlockerActive || isSaving || openDialog,
					inProgress: isSaving,
					dismissOnClick: true,
					dismissOptions: {
						expiresInSeconds: 2 * WEEK_IN_SECONDS,
						skipHidingFromQueue: true,
					},
				} }
				dismissButton={ {
					label: dismissLabel,
					onClick: showTooltip,
					disabled: isSaving,
					dismissOptions: {
						expiresInSeconds: isDismissalFinal
							? 0
							: 2 * WEEK_IN_SECONDS,
					},
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'center',
				} }
			/>
			{ openDialog && (
				<WooCommerceRedirectModal
					onDismiss={ () => dismissNotification( id ) }
					onClose={ onModalClose }
					onBeforeSetupCallback={ dismissWooCommerceRedirectModal }
					dialogActive
				/>
			) }
			<SurveyViewTrigger
				triggerID="view_ads_setup_cta"
				ttl={ DAY_IN_SECONDS }
			/>
		</Notification>
	);
}

AdsModuleSetupCTABanner.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
