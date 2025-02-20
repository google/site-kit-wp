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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from 'googlesitekit-components';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY } from '../../datastore/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import WooLogoIcon from '../../../../../svg/graphics/woo-logo.svg';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';

export default function WooCommerceRedirectModal( {
	dialogActive,
	onDismiss,
} ) {
	const adminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);
	const isWooCommerceActive = useSelect( ( select ) =>
		select( CORE_SITE ).isWooCommerceActivated()
	);
	const isGoogleForWooCommerceActive = useSelect( ( select ) =>
		select( CORE_SITE ).isGoogleForWooCommerceActivated()
	);

	const googleForWooCommerceRedirectURI = useMemo( () => {
		if ( ! adminURL || ! isWooCommerceActive ) {
			return undefined;
		}

		if ( isGoogleForWooCommerceActive === false ) {
			return addQueryArgs( `${ adminURL }/plugin-install.php`, {
				s: 'google-listings-and-ads',
				tab: 'search',
				type: 'term',
			} );
		}

		const googleDashboardPath = encodeURIComponent( '/google/dashboard' );
		return `${ adminURL }/admin.php?page=wc-admin&path=${ googleDashboardPath }`;
	}, [ adminURL, isWooCommerceActive, isGoogleForWooCommerceActive ] );

	const { setCacheItem } = useDispatch( CORE_SITE );

	const markModalDismissed = useCallback( async () => {
		await setCacheItem( ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY, {
			ttl: 0,
		} );
	}, [ setCacheItem ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const getGoogleForWooCommerceRedirectURI = useCallback( async () => {
		await markModalDismissed();

		navigateTo( googleForWooCommerceRedirectURI );
	}, [ navigateTo, googleForWooCommerceRedirectURI ] );

	const onSetupCallback = useActivateModuleCallback( 'ads' );

	const onContinueWithSiteKit = useCallback( async () => {
		// Store dismissal in cache first, since onSetupCallback will invoke navigateTo().
		await markModalDismissed();

		onSetupCallback();
	}, [ markModalDismissed, onSetupCallback ] );

	return (
		<Dialog
			open={ dialogActive }
			aria-describedby={ undefined }
			tabIndex="-1"
			className="googlesitekit-dialog-woocommerce-redirect"
			onClose={ onDismiss }
		>
			<div className="googlesitekit-dialog-woocommerce-redirect__svg-wrapper">
				<WooLogoIcon width={ 110 } height={ 46 } />
			</div>
			<DialogTitle>
				{ __( 'Using the WooCommerce plugin?', 'google-site-kit' ) }
			</DialogTitle>
			<DialogContent>
				<p>
					{ __(
						'The Google for WooCommerce plugin can utilize your provided business information for advertising on Google and may be more suitable for your business.',
						'google-site-kit'
					) }
				</p>
			</DialogContent>
			<DialogFooter>
				<Button
					className="mdc-dialog__cancel-button"
					tertiary
					onClick={ onContinueWithSiteKit }
				>
					{ __( 'Continue with Site Kit', 'google-site-kit' ) }
				</Button>
				<Button
					trailingIcon={ <ExternalIcon width={ 13 } height={ 13 } /> }
					onClick={ getGoogleForWooCommerceRedirectURI }
				>
					{ __( 'Use Google for WooCommerce', 'google-site-kit' ) }
				</Button>
			</DialogFooter>
		</Dialog>
	);
}
