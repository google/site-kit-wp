/**
 * Ads Setup form.
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
import SetupEnhancedConversionTrackingNotice from './SetupEnhancedConversionTrackingNotice';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

export default function SetupForm( {
	finishSetup,
	createAccountCTA,
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
		<form className="googlesitekit-ads-setup__form" onSubmit={ submitForm }>
			<StoreErrorNotices moduleSlug="ads" storeName={ MODULES_ADS } />

			<div className="googlesitekit-setup-module__inputs">
				<ConversionIDTextField />
			</div>

			{ createAccountCTA && (
				<div className="googlesitekit-setup-module__create-account">
					{ createAccountCTA }
				</div>
			) }

			<SetupEnhancedConversionTrackingNotice />

			<div className="googlesitekit-setup-module__action">
				<SpinnerButton
					disabled={ ! canSubmitChanges || isSaving }
					isSaving={ isSaving }
				>
					{ __( 'Complete setup', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
	createAccountCTA: PropTypes.node,
	isNavigatingToOAuthURL: PropTypes.bool,
};

SetupForm.defaultProps = {
	finishSetup: () => {},
	createAccountCTA: null,
	isNavigatingToOAuthURL: false,
};
