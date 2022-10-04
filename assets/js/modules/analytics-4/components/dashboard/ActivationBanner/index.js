/**
 * ActivationBanner component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import isEmpty from 'lodash/isEmpty';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ReminderBanner from './ReminderBanner';
import SetupBanner from './SetupBanner';
import SuccessBanner from './SuccessBanner';
import {
	ACTIVATION_STEP_REMINDER,
	ACTIVATION_STEP_SETUP,
	ACTIVATION_STEP_SUCCESS,
	GA4_ACTIVATION_BANNER_STATE_KEY,
} from '../../../constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS,
} from '../../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
const { useSelect, useDispatch, useRegistry } = Data;

export default function ActivationBanner() {
	const [ step, setStep ] = useState( ACTIVATION_STEP_REMINDER );

	const registry = useRegistry();

	const uaConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const ga4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const returnToSetupStep = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			GA4_ACTIVATION_BANNER_STATE_KEY,
			'returnToSetupStep'
		)
	);

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	// Collection of selectors on which the Setup Banner depends on.
	const setupBannerSelectors = useMemo(
		() => ( {
			getProperties: { store: MODULES_ANALYTICS_4, args: [ accountID ] },
			getAccounts: { store: MODULES_ANALYTICS },
			getSettings: { store: MODULES_ANALYTICS_4 },
		} ),
		[ accountID ]
	);

	const setupBannerErrors = useSelect( ( select ) => {
		const returnObj = {};

		Object.keys( setupBannerSelectors ).forEach( ( selector ) => {
			const { store, args } = setupBannerSelectors[ selector ];

			const error = select( store ).getErrorForSelector(
				selector,
				args || []
			);

			if ( error ) {
				returnObj[ selector ] = error;
			}
		} );

		return returnObj;
	} );

	const hasSetupBannerError = ! isEmpty( setupBannerErrors );

	const dispatch = useDispatch();
	const { setValues } = dispatch( CORE_FORMS );

	useEffect( () => {
		if ( hasEditScope && returnToSetupStep ) {
			setStep( ACTIVATION_STEP_SETUP );
			setValues( GA4_ACTIVATION_BANNER_STATE_KEY, {
				returnToSetupStep: false,
			} );
		}
	}, [ hasEditScope, registry, returnToSetupStep, setValues ] );

	useEffect( () => {
		if ( hasSetupBannerError ) {
			setStep( ACTIVATION_STEP_REMINDER );
		}
	}, [ hasSetupBannerError ] );

	const handleSubmit = useCallback( async () => {
		if ( step === ACTIVATION_STEP_REMINDER ) {
			// Clear errors before navigating to Setup Banner.
			if ( hasSetupBannerError ) {
				Object.keys( setupBannerErrors ).forEach(
					async ( selector ) => {
						const { store, args } =
							setupBannerSelectors[ selector ];

						await dispatch( store ).clearError(
							selector,
							args || []
						);
						await dispatch( store ).invalidateResolution(
							selector,
							args || []
						);
					}
				);
			}

			setStep( ACTIVATION_STEP_SETUP );
		}

		if ( ! returnToSetupStep && step === ACTIVATION_STEP_SETUP ) {
			setStep( ACTIVATION_STEP_SUCCESS );
		}

		return { dismissOnCTAClick: false };
	}, [
		step,
		returnToSetupStep,
		hasSetupBannerError,
		setupBannerErrors,
		setupBannerSelectors,
		dispatch,
	] );

	if ( ! uaConnected || ga4Connected ) {
		return null;
	}

	switch ( step ) {
		case ACTIVATION_STEP_REMINDER:
			return (
				<ReminderBanner
					onSubmitSuccess={ handleSubmit }
					errors={
						! isEmpty( setupBannerErrors ) && setupBannerErrors
					}
				/>
			);
		case ACTIVATION_STEP_SETUP:
			return <SetupBanner onSubmitSuccess={ handleSubmit } />;
		case ACTIVATION_STEP_SUCCESS:
			return <SuccessBanner />;
		default:
			return null;
	}
}
