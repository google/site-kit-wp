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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MINUTE_IN_SECONDS, WEEK_IN_SECONDS } from '../../../../util';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
	MODULES_ADS,
	MODULE_SLUG_ADS,
} from '../../datastore/constants';
import AdsSetupSVG from '../../../../../svg/graphics/ads-setup.svg';
import AdsSetupTabletSVG from '../../../../../svg/graphics/ads-setup-tablet.svg';
import AdsSetupMobileSVG from '../../../../../svg/graphics/ads-setup-mobile.svg';
import NotificationWithSVG from '../../../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import Description from '../../../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import { WooCommerceRedirectModal } from '../common';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';
import { useShowTooltip } from '../../../../components/AdminMenuTooltip';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

const breakpointSVGMap = {
	[ BREAKPOINT_SMALL ]: AdsSetupMobileSVG,
	[ BREAKPOINT_TABLET ]: AdsSetupTabletSVG,
};

export default function AdsModuleSetupCTABanner( { id, Notification } ) {
	const breakpoint = useBreakpoint();
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

	const markNotificationDismissed = useCallback( () => {
		dismissNotification( id, {
			skipHidingFromQueue: true,
			expiresInSeconds: 2 * WEEK_IN_SECONDS,
		} );
	}, [ id, dismissNotification ] );

	const { setCacheItem } = useDispatch( CORE_SITE );
	const dismissWooCommerceRedirectModal = useCallback( () => {
		setCacheItem( ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY, true, {
			ttl: 5 * MINUTE_IN_SECONDS,
		} );
	}, [ setCacheItem ] );

	const activateModule = useActivateModuleCallback( MODULE_SLUG_ADS );

	const onSetupCallback = useCallback( () => {
		if (
			! shouldShowWooCommerceRedirectModal ||
			isWooCommerceRedirectModalDismissed
		) {
			setIsSaving( true );
			markNotificationDismissed();
			activateModule();
			return;
		}

		setOpenDialog( true );
	}, [
		shouldShowWooCommerceRedirectModal,
		activateModule,
		markNotificationDismissed,
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
			<NotificationWithSVG
				id={ id }
				title={ __(
					'Get better quality leads and enhance conversions with Ads',
					'google-site-kit'
				) }
				description={
					<Description
						text={ __(
							'Help drive sales, leads, or site traffic by getting your business in front of people who are actively searching Google for products or services you offer.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ learnMoreURL }
							/>
						}
					>
						{ isAdBlockerActive && (
							<AdBlockerWarning moduleSlug="ads" />
						) }
					</Description>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						className="googlesitekit-setup-cta-banner__actions-wrapper"
						ctaLabel={ __( 'Set up Ads', 'google-site-kit' ) }
						onCTAClick={ onSetupCallback }
						dismissOnCTAClick={ false }
						isSaving={ isSaving }
						dismissLabel={ dismissLabel }
						ctaDismissOptions={ {
							skipHidingFromQueue: true,
						} }
						onDismiss={ showTooltip }
						dismissExpires={ 2 * WEEK_IN_SECONDS }
						ctaDisabled={ isAdBlockerActive }
					/>
				}
				SVG={ breakpointSVGMap[ breakpoint ] || AdsSetupSVG }
			/>
			{ openDialog && (
				<WooCommerceRedirectModal
					onDismiss={ markNotificationDismissed }
					onClose={ onModalClose }
					onBeforeSetupCallback={ dismissWooCommerceRedirectModal }
					dialogActive
				/>
			) }
		</Notification>
	);
}

AdsModuleSetupCTABanner.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
