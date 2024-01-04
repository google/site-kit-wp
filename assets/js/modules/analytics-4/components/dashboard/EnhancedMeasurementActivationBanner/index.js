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
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import {
	ACTIVATION_STEP_IN_PROGRESS,
	ACTIVATION_STEP_SETUP,
	ACTIVATION_STEP_SUCCESS,
	ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY,
	ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
} from '../../../constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '../../../../analytics/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../util/errors';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import InProgressBanner from './InProgressBanner';
import SetupBanner from './SetupBanner';
import SuccessBanner from './SuccessBanner';
import { getTimeInSeconds, trackEvent } from '../../../../../util';
import whenActive from '../../../../../util/when-active';
import {
	isValidPropertyID,
	isValidWebDataStreamID,
} from '../../../utils/validation';
import useViewContext from '../../../../../hooks/useViewContext';

const { useSelect, useDispatch } = Data;

function EnhancedMeasurementActivationBanner() {
	const viewContext = useViewContext();

	const [ step, setStep ] = useState( ACTIVATION_STEP_SETUP );
	const [
		isEnhancedMeasurementInitiallyDisabled,
		setIsEnhancedMeasurementInitiallyDisabled,
	] = useState( undefined );
	const [ isEnabling, setIsEnabling ] = useState( false );
	const [ errorNotice, setErrorNotice ] = useState( null );

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const isBannerDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY
		)
	);

	const hasAnalytics4Access = useSelect( ( select ) =>
		select( CORE_MODULES ).hasModuleOwnershipOrAccess( 'analytics-4' )
	);

	const isEnhancedMeasurementStreamEnabled = useSelect( ( select ) => {
		if (
			! isValidPropertyID( propertyID ) ||
			! isValidWebDataStreamID( webDataStreamID ) ||
			! hasAnalytics4Access ||
			isBannerDismissed
		) {
			return undefined;
		}

		return select( MODULES_ANALYTICS_4 ).isEnhancedMeasurementStreamEnabled(
			propertyID,
			webDataStreamID
		);
	} );

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { dismissItem, setPermissionScopeError } = useDispatch( CORE_USER );
	const { submitChanges } = useDispatch( MODULES_ANALYTICS_4 );

	const { isTooltipVisible } = useTooltipState(
		ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY
	);

	const showTooltip = useShowTooltip(
		ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY
	);

	function handleDismiss() {
		showTooltip();
		dismissItem(
			ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
			{
				expiresInSeconds: getTimeInSeconds( 'month' ),
			}
		);
	}

	const commonSubmitChanges = useCallback( async () => {
		setIsEnabling( true );

		setValues( ENHANCED_MEASUREMENT_FORM, {
			[ ENHANCED_MEASUREMENT_ENABLED ]: true,
		} );

		const { error } = await submitChanges();

		setIsEnabling( false );

		if ( error ) {
			setErrorNotice( error );
			return;
		}

		trackEvent(
			`${ viewContext }_enhanced-measurement-notification`,
			'confirm_notification'
		);

		if ( step === ACTIVATION_STEP_SETUP ) {
			setStep( ACTIVATION_STEP_SUCCESS );
		}
	}, [ setValues, submitChanges, viewContext, step ] );

	const handleSubmitChanges = useCallback( async () => {
		const scopes = [];

		if ( hasEditScope === false ) {
			scopes.push( EDIT_SCOPE );
		}

		// If scope not granted, trigger scope error right away. These are
		// typically handled automatically based on API responses, but
		// this particular case has some special handling to improve UX.
		if ( scopes.length > 0 ) {
			setValues( FORM_SETUP, { autoSubmit: true } );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to enable enhanced measurement for the selected web data stream.',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes,
					skipModal: true,
					redirectURL: global.location.href,
				},
			} );
			return;
		}

		await commonSubmitChanges();
	}, [
		hasEditScope,
		commonSubmitChanges,
		setPermissionScopeError,
		setValues,
	] );

	useEffect( () => {
		if (
			isEnhancedMeasurementStreamEnabled === false &&
			isEnhancedMeasurementInitiallyDisabled === undefined
		) {
			setIsEnhancedMeasurementInitiallyDisabled( true );
		}
	}, [
		isEnhancedMeasurementInitiallyDisabled,
		isEnhancedMeasurementStreamEnabled,
	] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		async function handleAutoSubmit() {
			// Auto-submit should only auto-invoke once.
			setValues( FORM_SETUP, { autoSubmit: false } );

			if ( step === ACTIVATION_STEP_SETUP ) {
				setStep( ACTIVATION_STEP_IN_PROGRESS );
			}

			await commonSubmitChanges();
		}

		if ( autoSubmit && hasEditScope ) {
			handleAutoSubmit();
		}
	}, [ hasEditScope, setValues, commonSubmitChanges, autoSubmit, step ] );

	if ( isTooltipVisible ) {
		return (
			<AdminMenuTooltip
				title={ __(
					'Enable enhanced measurement later here',
					'google-site-kit'
				) }
				content={ __(
					'You can always turn on enhanced measurement later in Site Kit Settings.',
					'google-site-kit'
				) }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				tooltipStateKey={
					ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY
				}
			/>
		);
	}

	if ( ! isEnhancedMeasurementInitiallyDisabled || isBannerDismissed ) {
		return null;
	}

	if ( step === ACTIVATION_STEP_SETUP ) {
		return (
			<SetupBanner
				errorNotice={ errorNotice }
				isSaving={ isEnabling }
				onDismiss={ handleDismiss }
				onSubmit={ handleSubmitChanges }
			/>
		);
	}

	if ( step === ACTIVATION_STEP_IN_PROGRESS ) {
		return <InProgressBanner />;
	}

	if ( step === ACTIVATION_STEP_SUCCESS ) {
		return <SuccessBanner />;
	}

	return null;
}

export default whenActive( { moduleName: 'analytics-4' } )(
	EnhancedMeasurementActivationBanner
);
