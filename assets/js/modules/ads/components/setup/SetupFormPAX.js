/**
 * Ads PAX Setup form.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import { MODULES_ADS } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { ConversionIDTextField } from '../common';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import WarningNotice from '../../../../components/WarningNotice';

export default function SetupFormPAX( {
	finishSetup,
	isNavigatingToOAuthURL,
} ) {
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADS ).canSubmitChanges()
	);
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_ADS ).isDoingSubmitChanges() &&
			! isNavigatingToOAuthURL
	);

	const { submitChanges } = useDispatch( MODULES_ADS );
	const { setConversionTrackingEnabled, saveConversionTrackingSettings } =
		useDispatch( CORE_SITE );

	const currentConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getConversionID()
	);

	const googleListingsAndAdsConnectedAdsID = useSelect( ( select ) =>
		select( MODULES_ADS ).getGoogleForWooCommerceConversionID()
	);

	const isDuplicateAdsIDDetected =
		!! currentConversionID &&
		currentConversionID === googleListingsAndAdsConnectedAdsID;

	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();

			const { error } = await submitChanges();

			if ( ! error ) {
				setConversionTrackingEnabled( true );
				await saveConversionTrackingSettings();
				finishSetup();
			}
		},
		[
			finishSetup,
			saveConversionTrackingSettings,
			setConversionTrackingEnabled,
			submitChanges,
		]
	);

	return (
		<div className="googlesitekit-ads-setup__form googlesitekit-ads-setup__form--pax">
			<StoreErrorNotices moduleSlug="ads" storeName={ MODULES_ADS } />

			<div className="googlesitekit-setup-module__inputs">
				<ConversionIDTextField hideHeading />
			</div>

			{ isDuplicateAdsIDDetected && (
				<WarningNotice className="googlesitekit-ads-setup__ads-id-conflict-warning">
					{ __(
						'This Conversion ID is already in use via the Google for WooCommerce plugin. We don’t recommend adding it in Site Kit, as it may result in inaccurate measurement of your Ads campaign conversions.',
						'google-site-kit'
					) }
				</WarningNotice>
			) }

			<div className="googlesitekit-setup-module__action">
				<SpinnerButton
					disabled={
						! canSubmitChanges ||
						isSaving ||
						isDuplicateAdsIDDetected
					}
					isSaving={ isSaving }
					onClick={ submitForm }
				>
					{ __( 'Complete manual setup', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</div>
	);
}

SetupFormPAX.propTypes = {
	finishSetup: PropTypes.func,
	isNavigatingToOAuthURL: PropTypes.bool,
};
