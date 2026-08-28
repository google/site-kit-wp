/**
 * WooCommerce Redirect Modal component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import P from '@/js/components/Typography/P';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { MODULES_ADS, PLUGINS } from '@/js/modules/ads/datastore/constants';
import { trackEvent } from '@/js/util';
import WooLogoIcon from '@/svg/graphics/woo-logo.svg';
import ExternalIcon from '@/svg/icons/external.svg';

const ACCOUNT_LINKED_NOTIFICATION_ID =
	'account-linked-via-google-for-woocommerce';

export default function WooCommerceRedirectModal( {
	dialogActive,
	onClose = null,
	onContinueWithSiteKit,
	onUseGoogleForWooCommerce = null,
} ) {
	// Tracks which of the two CTAs is awaiting navigation, so only that button
	// renders a spinner. One of `null`, `'primary'` or `'tertiary'`.
	const [ isSaving, setIsSaving ] = useState( null );
	const viewContext = useViewContext();

	const adminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);
	const isWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceActivated()
	);
	const isGoogleForWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_ADS ).isGoogleForWooCommerceActivated()
	);
	const hasGoogleForWooCommerceAdsAccount = useSelect( ( select ) =>
		select( MODULES_ADS ).hasGoogleForWooCommerceAdsAccount()
	);
	const isModalDismissed = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceRedirectModalDismissed()
	);
	const isAccountLinkedNotificationDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( ACCOUNT_LINKED_NOTIFICATION_ID )
	);

	// An Ads account already reachable through the Google for WooCommerce
	// extension changes both the copy and the behaviour of both CTAs.
	const isGoogleForWooCommerceAdsConnected =
		!! isWooCommerceActive &&
		!! isGoogleForWooCommerceActive &&
		!! hasGoogleForWooCommerceAdsAccount;

	const trackEventCategory = `${ viewContext }_pax_wc-redirect`;
	const trackEventLabel = isGoogleForWooCommerceActive ? 'gfw' : 'wc';

	useEffect( () => {
		if ( dialogActive ) {
			trackEvent( trackEventCategory, 'view_modal', trackEventLabel );
		}
	}, [ dialogActive, trackEventCategory, trackEventLabel ] );

	const googleForWooCommerceURL = useMemo( () => {
		if ( ! adminURL || ! isWooCommerceActive ) {
			return undefined;
		}

		if ( isGoogleForWooCommerceActive === false ) {
			return addQueryArgs( `${ adminURL }/plugin-install.php`, {
				s: PLUGINS.GOOGLE_FOR_WOOCOMMERCE,
				tab: 'search',
				type: 'term',
			} );
		}

		const googleDashboardPath = encodeURIComponent( '/google/dashboard' );
		return `${ adminURL }/admin.php?page=wc-admin&path=${ googleDashboardPath }`;
	}, [ adminURL, isWooCommerceActive, isGoogleForWooCommerceActive ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	// Copy for the two states the modal can be in.
	const content = isGoogleForWooCommerceAdsConnected
		? {
				title: __(
					'Are you sure you want to create another Ads account for this site?',
					'google-site-kit'
				),
				description: (
					<Fragment>
						{ __(
							'Site Kit has detected an already existing Ads account connected to this site via the Google for WooCommerce extension.',
							'google-site-kit'
						) }
						<br />
						{ __(
							'Continue Ads setup with Site Kit only if you do want to create another account.',
							'google-site-kit'
						) }
					</Fragment>
				),
				siteKitCTALabel: __(
					'Create another account',
					'google-site-kit'
				),
				googleForWooCommerceCTALabel: __(
					'View current Ads account',
					'google-site-kit'
				),
		  }
		: {
				title: __( 'Using the WooCommerce plugin?', 'google-site-kit' ),
				description: __(
					'The Google for WooCommerce plugin can utilize your provided business information for advertising on Google and may be more suitable for your business.',
					'google-site-kit'
				),
				siteKitCTALabel: __(
					'Continue with Site Kit',
					'google-site-kit'
				),
				googleForWooCommerceCTALabel: __(
					'Use Google for WooCommerce',
					'google-site-kit'
				),
		  };

	// When an Ads account is already connected the CTA navigates imperatively,
	// so it must not also be rendered as a link. Otherwise the CTA is a plain
	// external link and the browser performs the navigation.
	const googleForWooCommerceCTAProps = isGoogleForWooCommerceAdsConnected
		? {}
		: {
				href: googleForWooCommerceURL,
				target: '_blank',
				trailingIcon: <ExternalIcon width={ 13 } height={ 13 } />,
				tertiary: true,
		  };

	function handleClose() {
		onClose?.();
	}

	function handleContinueWithSiteKit() {
		trackEvent( trackEventCategory, 'choose_sk', trackEventLabel );

		setIsSaving( 'tertiary' );

		onContinueWithSiteKit();
	}

	async function handleUseGoogleForWooCommerce() {
		if ( ! isAccountLinkedNotificationDismissed ) {
			dismissNotification( ACCOUNT_LINKED_NOTIFICATION_ID );
		}

		await trackEvent( trackEventCategory, 'choose_gfw', trackEventLabel );

		// The CTA is not a link in this state, so navigate imperatively.
		if ( isGoogleForWooCommerceAdsConnected ) {
			setIsSaving( 'primary' );
			navigateTo( googleForWooCommerceURL );
		}

		// Close before handing back to the caller: callers may dismiss a
		// notification here, which unmounts them, and an unmounted caller can
		// no longer act on the close callback.
		handleClose();
		onUseGoogleForWooCommerce?.();
	}

	// Without WooCommerce active there is no Google for WooCommerce
	// destination, so the CTA only closes the modal.
	const handleGoogleForWooCommerceCTAClick = isWooCommerceActive
		? handleUseGoogleForWooCommerce
		: handleClose;

	if ( isModalDismissed && ! isSaving ) {
		return null;
	}

	return (
		<Dialog
			className={ classnames(
				'googlesitekit-dialog-woocommerce-redirect',
				{
					'googlesitekit-dialog-woocommerce-redirect--ads-connected':
						isGoogleForWooCommerceAdsConnected,
				}
			) }
			open={ dialogActive }
			aria-describedby={ undefined }
			tabIndex="-1"
			onClose={ onClose }
		>
			<div className="googlesitekit-dialog-woocommerce-redirect__svg-wrapper">
				<WooLogoIcon width={ 110 } height={ 46 } />
			</div>
			<DialogTitle>{ content.title }</DialogTitle>
			<DialogContent>
				<P>{ content.description }</P>
			</DialogContent>
			<DialogFooter>
				<Button
					className="mdc-dialog__cancel-button"
					onClick={ handleContinueWithSiteKit }
					icon={
						isSaving === 'tertiary' ? (
							<CircularProgress size={ 14 } />
						) : undefined
					}
					disabled={ !! isSaving }
					tertiary
				>
					{ content.siteKitCTALabel }
				</Button>
				<Button
					{ ...googleForWooCommerceCTAProps }
					onClick={ handleGoogleForWooCommerceCTAClick }
					icon={
						isSaving === 'primary' ? (
							<CircularProgress size={ 14 } />
						) : undefined
					}
					disabled={ !! isSaving }
				>
					{ content.googleForWooCommerceCTALabel }
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

WooCommerceRedirectModal.propTypes = {
	dialogActive: PropTypes.bool.isRequired,
	onClose: PropTypes.func,
	onContinueWithSiteKit: PropTypes.func.isRequired,
	onUseGoogleForWooCommerce: PropTypes.func,
};
