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
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import {
	ACTIVATION_STEP_SETUP,
	ACTIVATION_STEP_SUCCESS,
	ENHANCED_MEASUREMENT_ACTIVATION_BANNER_TOOLTIP_STATE_KEY,
	ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
} from '../../../constants';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import SetupBanner from './SetupBanner';
import SuccessBanner from './SuccessBanner';
import { getTimeInSeconds } from '../../../../../util';
import whenActive from '../../../../../util/when-active';
import {
	isValidPropertyID,
	isValidWebDataStreamID,
} from '../../../utils/validation';

const { useSelect, useDispatch } = Data;

function EnhancedMeasurementActivationBanner() {
	const [ step, setStep ] = useState( ACTIVATION_STEP_SETUP );
	// Note: We use state here so we can trigger a re-render when setting it, in order to show the banner.
	const [
		isEnhancedMeasurementInitiallyDisabled,
		setIsEnhancedMeasurementInitiallyDisabled,
	] = useState( undefined );

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
			! (
				isValidPropertyID( propertyID ) &&
				isValidWebDataStreamID( webDataStreamID ) &&
				hasAnalytics4Access
			)
		) {
			return undefined;
		}

		return select( MODULES_ANALYTICS_4 ).isEnhancedMeasurementStreamEnabled(
			propertyID,
			webDataStreamID
		);
	} );

	const { dismissItem } = useDispatch( CORE_USER );

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

	const handleSubmit = useCallback( () => {
		if ( step === ACTIVATION_STEP_SETUP ) {
			setStep( ACTIVATION_STEP_SUCCESS );
		}
	}, [ step ] );

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

	switch ( step ) {
		case ACTIVATION_STEP_SETUP:
			return (
				<SetupBanner
					onSubmitSuccess={ handleSubmit }
					onDismiss={ handleDismiss }
				/>
			);
		case ACTIVATION_STEP_SUCCESS:
			return <SuccessBanner />;
		default:
			return null;
	}
}

export default whenActive( { moduleName: 'analytics-4' } )(
	EnhancedMeasurementActivationBanner
);
