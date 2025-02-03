/**
 * WooCommerceRedirectModal component.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	SpinnerButton,
} from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

function WooCommerceRedirectModal( { dialogActive = false, onDismiss } ) {
	const WC_REDIRECT_SCENARIOS = {
		DEFAULT: 0,
		WC_ACTIVE_WITH_NO_GFW: 1,
		WC_ACTIVE_WITH_GFW_NO_ADS_LINKED: 2,
		WC_ACTIVE_WITH_GFW_ADS_LINKED: 3,
	};
	const isWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceActive()
	);

	/*	const isGoogleForWooCommercePresent = useSelect( ( select ) =>
		select( MODULES_ADS ).isGoogleForWooCommercePresent()
	);*/

	const isGoogleForWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_ADS ).isGoogleForWooCommerceActive()
	);

	const isGoogleForWooCommerceAdsAccountLinked = useSelect( ( select ) =>
		select( MODULES_ADS ).isGoogleForWooCommerceAdsAccountLinked()
	);

	const wooCommerceScenarios = () => {
		if ( isWooCommerceActive && ! isGoogleForWooCommerceActive ) {
			return WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_NO_GFW;
		} else if (
			isWooCommerceActive &&
			isGoogleForWooCommerceActive &&
			! isGoogleForWooCommerceAdsAccountLinked
		) {
			return WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_NO_ADS_LINKED;
		} else if (
			isWooCommerceActive &&
			isGoogleForWooCommerceActive &&
			isGoogleForWooCommerceAdsAccountLinked
		) {
			return WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_ADS_LINKED;
		}

		return WC_REDIRECT_SCENARIOS.DEFAULT;
	};

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);

	const adminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);

	const navigateToGoogleForWooCommerce = () => {
		switch ( wooCommerceScenarios() ) {
			case WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_NO_GFW:
				navigateTo(
					`${ adminURL }/plugin-install.php?s=google-listings-and-ads&tab=search&type=term`
				);
				break;
			case WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_NO_ADS_LINKED:
				navigateTo(
					`${ adminURL }/admin.php?page=wc-admin&path=%2Fgoogle%2Fdashboard`
				);
				break;
			case WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_ADS_LINKED:
				navigateTo(
					`${ adminURL }/admin.php?page=wc-admin&path=%2Fgoogle%2Fdashboard`
				);
				break;
		}
	};

	if ( WC_REDIRECT_SCENARIOS.DEFAULT === wooCommerceScenarios() ) {
		return '';
	}

	return (
		<Dialog
			open={ dialogActive }
			aria-describedby={ undefined }
			tabIndex="-1"
			className="googlesitekit-dialog-confirm-site-purpose-change"
			onClose={ onDismiss }
		>
			<DialogTitle>
				{ WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_NO_GFW ===
					wooCommerceScenarios() &&
					__(
						'We’ve detected the WooCommerce plugin on your site',
						'google-site-kit'
					) }
				{ WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_NO_ADS_LINKED ===
					wooCommerceScenarios() &&
					__(
						'We’ve detected the WooCommerce & Google for WooCommerce plugins on your site',
						'google-site-kit'
					) }
				{ WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_ADS_LINKED ===
					wooCommerceScenarios() &&
					__(
						'We’ve detected an existing Google Ads account via Google for WooCommerce',
						'google-site-kit'
					) }
			</DialogTitle>
			<DialogContent>
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-8-tablet mdc-layout-grid__cell--span-8-phone">
						{ ( WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_NO_GFW ===
							wooCommerceScenarios() ||
							WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_NO_ADS_LINKED ===
								wooCommerceScenarios() ) &&
							__(
								'The Google for WooCommerce app can utilize your provided business information for advertising on Google and may be more suitable for your business.',
								'google-site-kit'
							) }
						{ WC_REDIRECT_SCENARIOS.WC_ACTIVE_WITH_GFW_ADS_LINKED ===
							wooCommerceScenarios() &&
							__(
								'You have an existing Google Ads account via the Google for WooCommerce plugin. To access your existing account, visit Google for WooCommerce. To proceed with a new Google Ads account, continue.',
								'google-site-kit'
							) }
					</div>
				</div>
			</DialogContent>
			<DialogFooter>
				<Button onClick={ onDismiss } tertiary>
					{ __( 'Continue with Site Kit', 'google-site-kit' ) }
				</Button>
				<SpinnerButton
					className="mdc-dialog__cancel-button"
					onClick={ navigateToGoogleForWooCommerce }
					isSaving={ isNavigating }
				>
					{ __( 'Use Google for WooCommerce', 'google-site-kit' ) }
				</SpinnerButton>
			</DialogFooter>
		</Dialog>
	);
}

WooCommerceRedirectModal.propTypes = {
	dialogActive: PropTypes.bool,
	handleDialog: PropTypes.func,
	onDismiss: PropTypes.func.isRequired,
};

export default WooCommerceRedirectModal;
