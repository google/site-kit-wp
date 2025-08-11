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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useMemo,
	Fragment,
	useState,
	useEffect,
} from '@wordpress/element';
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
import { MODULE_SLUG_ADS } from '../../constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import WooLogoIcon from '../../../../../svg/graphics/woo-logo.svg';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import Typography from '../../../../components/Typography';

export default function WooCommerceRedirectModal( {
	dialogActive,
	onClose,
	onDismiss = null,
	onContinue = null,
	onBeforeSetupCallback = null,
} ) {
	const [ isSaving, setIsSaving ] = useState( '' );
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
	const trackEventLabel = isGoogleForWooCommerceActive ? 'gfw' : 'wc';

	useEffect( () => {
		if ( dialogActive ) {
			trackEvent(
				`${ viewContext }_pax_wc-redirect`,
				'view_modal',
				trackEventLabel
			);
		}
	}, [ dialogActive, viewContext, trackEventLabel ] );

	const isGoogleForWooCommerceAdsConnected = useSelect( ( select ) => {
		const hasGoogleForWooCommerceAdsAccount =
			select( MODULES_ADS ).hasGoogleForWooCommerceAdsAccount();

		if (
			isWooCommerceActive &&
			isGoogleForWooCommerceActive &&
			hasGoogleForWooCommerceAdsAccount
		) {
			return true;
		}

		return false;
	} );

	const isModalDismissed = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceRedirectModalDismissed()
	);

	const isAccountLinkedViaGoogleForWoocommerceNoticeDismissed = useSelect(
		( select ) =>
			select( CORE_USER ).isItemDismissed(
				'account-linked-via-google-for-woocommerce'
			)
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

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleGoogleForWooCommerceRedirect = useCallback( async () => {
		if ( ! isAccountLinkedViaGoogleForWoocommerceNoticeDismissed ) {
			dismissNotification( 'account-linked-via-google-for-woocommerce' );
		}

		await trackEvent(
			`${ viewContext }_pax_wc-redirect`,
			'choose_gfw',
			trackEventLabel
		);

		if ( isGoogleForWooCommerceAdsConnected ) {
			setIsSaving( 'primary' );
			navigateTo( googleForWooCommerceRedirectURI );
		}
		onDismiss?.();
		onClose?.();
	}, [
		isAccountLinkedViaGoogleForWoocommerceNoticeDismissed,
		dismissNotification,
		setIsSaving,
		onDismiss,
		onClose,
		navigateTo,
		googleForWooCommerceRedirectURI,
		viewContext,
		trackEventLabel,
		isGoogleForWooCommerceAdsConnected,
	] );

	const onSetupCallback = useActivateModuleCallback( MODULE_SLUG_ADS );

	const onContinueWithSiteKit = useCallback( () => {
		trackEvent(
			`${ viewContext }_pax_wc-redirect`,
			'choose_sk',
			trackEventLabel
		);

		if ( ! onContinue ) {
			setIsSaving( 'tertiary' );
			onDismiss?.();
		}

		if ( onContinue ) {
			// Override default module activation with custom callback.
			onClose();
			onContinue();
			return;
		}

		onBeforeSetupCallback?.();
		onSetupCallback();
	}, [
		setIsSaving,
		onDismiss,
		onClose,
		onBeforeSetupCallback,
		onSetupCallback,
		onContinue,
		viewContext,
		trackEventLabel,
	] );

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
			<DialogTitle>
				{ isGoogleForWooCommerceAdsConnected
					? __(
							'Are you sure you want to create another Ads account for this site?',
							'google-site-kit'
					  )
					: __( 'Using the WooCommerce plugin?', 'google-site-kit' ) }
			</DialogTitle>
			<DialogContent>
				<Typography as="p" size="medium" type="body">
					{ isGoogleForWooCommerceAdsConnected ? (
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
					) : (
						__(
							'The Google for WooCommerce plugin can utilize your provided business information for advertising on Google and may be more suitable for your business.',
							'google-site-kit'
						)
					) }
				</Typography>
			</DialogContent>
			<DialogFooter>
				<Button
					className="mdc-dialog__cancel-button"
					onClick={ onContinueWithSiteKit }
					icon={
						isSaving === 'tertiary' ? (
							<CircularProgress size={ 14 } />
						) : undefined
					}
					tertiary
				>
					{ isGoogleForWooCommerceAdsConnected
						? __( 'Create another account', 'google-site-kit' )
						: __( 'Continue with Site Kit', 'google-site-kit' ) }
				</Button>
				<Button
					trailingIcon={
						isGoogleForWooCommerceAdsConnected ? undefined : (
							<ExternalIcon width={ 13 } height={ 13 } />
						)
					}
					icon={
						isSaving === 'primary' ? (
							<CircularProgress size={ 14 } />
						) : undefined
					}
					onClick={ () => {
						if (
							isGoogleForWooCommerceAdsConnected ||
							isWooCommerceActive
						) {
							handleGoogleForWooCommerceRedirect();
						} else {
							onClose();
						}
					} }
					href={
						isGoogleForWooCommerceAdsConnected
							? null
							: googleForWooCommerceRedirectURI
					}
					target={
						isGoogleForWooCommerceAdsConnected ? '_self' : '_blank'
					}
					tertiary
				>
					{ isGoogleForWooCommerceAdsConnected
						? __( 'View current Ads account', 'google-site-kit' )
						: __(
								'Use Google for WooCommerce',
								'google-site-kit'
						  ) }
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

WooCommerceRedirectModal.propTypes = {
	dialogActive: PropTypes.bool.isRequired,
	onDismiss: PropTypes.func,
	onClose: PropTypes.func.isRequired,
	onContinue: PropTypes.func,
	onBeforeSetupCallback: PropTypes.func,
};
