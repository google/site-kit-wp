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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useRef } from '@wordpress/element';
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
	CircularProgress,
} from 'googlesitekit-components';
import { MODULES_ADS, PLUGINS } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import WooLogoIcon from '../../../../../svg/graphics/woo-logo.svg';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';

export default function WooCommerceRedirectModal( {
	dialogActive,
	onDismiss,
	onContinue = null,
} ) {
	const trackIsSavingRef = useRef( null );

	const adminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);
	const isWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceActivated()
	);
	const isGoogleForWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_ADS ).isGoogleForWooCommerceActivated()
	);
	const isModalDismissed = useSelect( ( select ) =>
		select( MODULES_ADS ).getWoocommerceModalCacheHit()
	);

	const googleForWooCommerceRedirectURI = useMemo( () => {
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

	const markModalDismissed = useCallback( () => {
		onDismiss( { skipClosing: trackIsSavingRef.current } );
	}, [ onDismiss ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const getGoogleForWooCommerceRedirectURI = useCallback( () => {
		trackIsSavingRef.current = 'primary';
		markModalDismissed();

		navigateTo( googleForWooCommerceRedirectURI );
	}, [ markModalDismissed, navigateTo, googleForWooCommerceRedirectURI ] );

	const onSetupCallback = useActivateModuleCallback( 'ads' );

	const onContinueWithSiteKit = useCallback( () => {
		if ( ! onContinue ) {
			trackIsSavingRef.current = 'tertiary';
		}

		markModalDismissed();

		if ( onContinue ) {
			// Override default module activation with custom callback.
			onContinue();
			return;
		}

		onSetupCallback();
	}, [ markModalDismissed, onSetupCallback, onContinue ] );

	if ( isModalDismissed && ! trackIsSavingRef.current ) {
		return null;
	}

	return (
		<Dialog
			open={ dialogActive }
			aria-describedby={ undefined }
			tabIndex="-1"
			className="googlesitekit-dialog-woocommerce-redirect"
			onClose={ () => {
				onDismiss( { skipClosing: null, skipDismissing: true } );
			} }
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
					icon={
						trackIsSavingRef.current === 'tertiary' ? (
							<CircularProgress size={ 14 } />
						) : undefined
					}
				>
					{ __( 'Continue with Site Kit', 'google-site-kit' ) }
				</Button>
				<Button
					trailingIcon={ <ExternalIcon width={ 13 } height={ 13 } /> }
					icon={
						trackIsSavingRef.current === 'primary' ? (
							<CircularProgress size={ 14 } />
						) : undefined
					}
					onClick={ getGoogleForWooCommerceRedirectURI }
				>
					{ __( 'Use Google for WooCommerce', 'google-site-kit' ) }
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

WooCommerceRedirectModal.propTypes = {
	dialogActive: PropTypes.bool.isRequired,
	onDismiss: PropTypes.func.isRequired,
	onContinue: PropTypes.func,
};
