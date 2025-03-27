/**
 * EnhancedMeasurementActivationBanner component.
 *
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

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	FORM_SETUP,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import {
	ACTIVATION_STEP_IN_PROGRESS,
	ACTIVATION_STEP_SETUP,
	ACTIVATION_STEP_SUCCESS,
	ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY,
} from '../../../constants';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import InProgressBanner from './InProgressBanner';
import SetupBanner from './SetupBanner';
import SuccessBanner from './SuccessBanner';

export default function EnhancedMeasurementActivationBanner( {
	id,
	Notification,
} ) {
	const [ step, setStep ] = useState( ACTIVATION_STEP_SETUP );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ errorNotice, setErrorNotice ] = useState( null );

	// See tooltip TODO below being actioned in #10003
	const isBannerDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			'enhanced-measurement-notification'
		)
	);
	const isDismissingBanner = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			'enhanced-measurement-notification'
		)
	);
	const hideCTABanner = isBannerDismissed || isDismissingBanner;

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( MODULES_ANALYTICS_4 );

	const { isTooltipVisible } = useTooltipState(
		ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY
	);

	const showTooltip = useShowTooltip(
		ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY
	);

	const handleSubmit = useCallback( async () => {
		setIsSaving( true );

		setValues( ENHANCED_MEASUREMENT_FORM, {
			[ ENHANCED_MEASUREMENT_ENABLED ]: true,
		} );

		const { error } = await submitChanges();

		setIsSaving( false );

		if ( error ) {
			setErrorNotice( error );
			setStep( ACTIVATION_STEP_SETUP );
			return;
		}

		setStep( ACTIVATION_STEP_SUCCESS );
	}, [ setValues, submitChanges ] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		async function handleAutoSubmit() {
			// Auto-submit should only auto-invoke once.
			setValues( FORM_SETUP, { autoSubmit: false } );

			setStep( ACTIVATION_STEP_IN_PROGRESS );

			await handleSubmit();
		}

		if ( autoSubmit && hasEditScope ) {
			handleAutoSubmit();
		}
	}, [ hasEditScope, setValues, handleSubmit, autoSubmit ] );

	if ( isTooltipVisible ) {
		return (
			<AdminMenuTooltip
				title={ __(
					'Enable enhanced measurement later here',
					'google-site-kit'
				) }
				content={ __(
					'You can always turn on enhanced measurement later in Site Kit Settings',
					'google-site-kit'
				) }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				tooltipStateKey={
					ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY
				}
			/>
		);
	}

	// We "incorrectly" pass true to the `skipHidingFromQueue` option when dismissing this banner.
	// This is because we don't want the component removed from the DOM as we have to still render
	// the `AdminMenuTooltip` in this component. This means that we have to rely on manually
	// checking for the dismissal state here.
	//
	// This will be removed in https://github.com/google/site-kit-wp/issues/10003
	if ( hideCTABanner ) {
		return null;
	}

	if ( step === ACTIVATION_STEP_SETUP ) {
		return (
			<SetupBanner
				id={ id }
				Notification={ Notification }
				hideCTABanner={ hideCTABanner }
				errorNotice={ errorNotice }
				isSaving={ isSaving }
				onDismiss={ showTooltip }
				onSubmit={ handleSubmit }
			/>
		);
	}

	if ( step === ACTIVATION_STEP_IN_PROGRESS ) {
		return <InProgressBanner id={ id } Notification={ Notification } />;
	}

	if ( step === ACTIVATION_STEP_SUCCESS ) {
		return <SuccessBanner id={ id } Notification={ Notification } />;
	}

	return null;
}

EnhancedMeasurementActivationBanner.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
