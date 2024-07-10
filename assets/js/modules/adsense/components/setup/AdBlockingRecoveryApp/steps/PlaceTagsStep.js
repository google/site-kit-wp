/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox, SpinnerButton } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import ErrorNotice from '../../../../../../components/ErrorNotice';
import Link from '../../../../../../components/Link';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import useViewContext from '../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../util';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP,
	MODULES_ADSENSE,
} from '../../../../datastore/constants';

export default function PlaceTagsStep( { setActiveStep } ) {
	const viewContext = useViewContext();

	const useAdBlockingRecoveryErrorSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockingRecoveryErrorSnippet()
	);
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_ADSENSE ).isDoingSaveSettings() ||
			select( MODULES_ADSENSE ).isFetchingSyncAdBlockingRecoveryTags()
	);
	const error = useSelect(
		( select ) =>
			select( MODULES_ADSENSE ).getErrorForAction(
				'syncAdBlockingRecoveryTags'
			) || select( MODULES_ADSENSE ).getErrorForAction( 'saveSettings' )
	);

	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ad-blocking-recovery' )
	);

	const {
		saveSettings,
		setAdBlockingRecoverySetupStatus,
		setUseAdBlockingRecoverySnippet,
		setUseAdBlockingRecoveryErrorSnippet,
		syncAdBlockingRecoveryTags,
	} = useDispatch( MODULES_ADSENSE );

	const onErrorProtectionTagOptionChange = useCallback(
		( { target } ) => {
			const isChecked = !! target.checked;

			setUseAdBlockingRecoveryErrorSnippet( isChecked );

			trackEvent(
				`${ viewContext }_adsense-abr`,
				isChecked ? 'check_box' : 'uncheck_box'
			);
		},
		[ setUseAdBlockingRecoveryErrorSnippet, viewContext ]
	);

	const onCTAClick = useCallback( async () => {
		const { error: syncError } = await syncAdBlockingRecoveryTags();

		if ( syncError ) {
			return;
		}

		setAdBlockingRecoverySetupStatus(
			ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED
		);
		setUseAdBlockingRecoverySnippet( true );

		const { error: saveError } = await saveSettings();

		if ( saveError ) {
			return;
		}

		await trackEvent( `${ viewContext }_adsense-abr`, 'setup_enable_tag' );

		setActiveStep( ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP.CREATE_MESSAGE );
	}, [
		saveSettings,
		setActiveStep,
		setAdBlockingRecoverySetupStatus,
		setUseAdBlockingRecoverySnippet,
		syncAdBlockingRecoveryTags,
		viewContext,
	] );

	useMount( () => {
		// Error snippet option is enabled by default.
		if ( ! useAdBlockingRecoveryErrorSnippet ) {
			setUseAdBlockingRecoveryErrorSnippet( true );
		}
		trackEvent( `${ viewContext }_adsense-abr`, 'setup_place_tag' );
	} );

	return (
		<Fragment>
			<p>
				{ __(
					'Identify site visitors that have an ad blocker browser extension installed. These site visitors will see the ad blocking recovery message created in AdSense.',
					'google-site-kit'
				) }
			</p>
			<Checkbox
				checked={ useAdBlockingRecoveryErrorSnippet }
				id="ad-blocking-recovery-error-protection-tag-checkbox"
				name="ad-blocking-recovery-error-protection-tag-checkbox"
				value="1"
				onChange={ onErrorProtectionTagOptionChange }
				alignLeft
			>
				{ __(
					'Enable error protection code (optional)',
					'google-site-kit'
				) }
			</Checkbox>
			<p className="googlesitekit-ad-blocking-recovery__error-protection-tag-info">
				{ createInterpolateElement(
					__(
						'If a site visitor’s ad blocker browser extension blocks the message you create in AdSense, a default, non-customizable ad blocking recovery message will display instead. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: <Link href={ learnMoreURL } external />,
					}
				) }
			</p>
			{ error && <ErrorNotice error={ error } /> }
			<SpinnerButton
				onClick={ onCTAClick }
				isSaving={ isSaving }
				disabled={ isSaving }
			>
				{ __( 'Enable message', 'google-site-kit' ) }
			</SpinnerButton>
		</Fragment>
	);
}

PlaceTagsStep.propTypes = {
	setActiveStep: PropTypes.func,
};
