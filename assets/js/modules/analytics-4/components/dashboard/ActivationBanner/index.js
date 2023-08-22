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
import { usePromise } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ReminderBanner from './ReminderBanner';
import SetupBanner from './SetupBanner';
import SuccessBanner from './SuccessBanner';
import ErrorNotice from '../../../../../components/ErrorNotice';
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
import { getItem } from '../../../../../googlesitekit/api/cache';
import whenActive from '../../../../../util/when-active';

const { useSelect, useDispatch, useRegistry } = Data;

function ActivationBanner() {
	const [ step, setStep ] = useState( null );
	const [ isDismissed, setIsDismissed ] = useState();
	const awaitWhileMounted = usePromise();

	const registry = useRegistry();

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

	// These are the selectors the Setup Banner uses; if any of them have encountered
	// an error we should reset the banner step and display the error on the welcome
	// step.
	const setupBannerErrors = useSelect( ( select ) => {
		return [
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getProperties',
				[ accountID ]
			),
			select( MODULES_ANALYTICS ).getErrorForSelector( 'getAccounts' ),
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getSettings' ),
		].filter( ( error ) => error !== undefined );
	} );

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

	// If any errors are encountered, we change the current form step the user is
	// on to essentially "reset" the banner back to the first step. If the user
	// tried to proceed but was offline, for instance, this would be detected and
	// return them to the first step of the banner rather than forcing an infinite
	// loading screen due to an error.
	//
	// See: https://github.com/google/site-kit-wp/issues/5928
	useEffect( () => {
		if ( setupBannerErrors.length > 0 ) {
			setStep( ACTIVATION_STEP_REMINDER );
		}
	}, [ setupBannerErrors.length ] );

	const handleSubmit = useCallback( async () => {
		if ( step === ACTIVATION_STEP_REMINDER ) {
			// Clear errors before navigating to Setup Banner.
			if ( setupBannerErrors.length > 0 ) {
				await Promise.all( [
					dispatch( MODULES_ANALYTICS_4 ).clearError(
						'getProperties',
						[ accountID ]
					),
					dispatch( MODULES_ANALYTICS_4 ).invalidateResolution(
						'getProperties',
						[ accountID ]
					),

					dispatch( MODULES_ANALYTICS ).clearError(
						'getAccounts',
						[]
					),
					dispatch( MODULES_ANALYTICS ).invalidateResolution(
						'getAccounts',
						[]
					),

					dispatch( MODULES_ANALYTICS_4 ).clearError(
						'getSettings',
						[]
					),
					dispatch( MODULES_ANALYTICS_4 ).invalidateResolution(
						'getSettings',
						[]
					),
				] );
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
		setupBannerErrors.length,
		dispatch,
		accountID,
	] );

	useEffect( () => {
		( async () => {
			const { cacheHit } = await awaitWhileMounted(
				getItem( 'notification::dismissed::ga4-activation-banner' )
			);
			setIsDismissed( cacheHit );
		} )();
	} );

	useEffect( () => {
		if ( isDismissed === undefined ) {
			return;
		}
		if ( step === null && ! ga4Connected ) {
			setStep( ACTIVATION_STEP_REMINDER );
		}
	}, [ ga4Connected, step, isDismissed ] );

	// Show unique errors.
	const errorNotice =
		setupBannerErrors.length > 0 &&
		setupBannerErrors
			.reduce( ( acc, error ) => {
				// If the error is already in our array of errors, skip it.
				if (
					acc.some(
						( err ) =>
							err.code === error.code &&
							err.message === error.message
					)
				) {
					return acc;
				}

				return [ ...acc, error ];
			}, [] )
			.map( ( error ) => (
				<ErrorNotice key={ error.code } error={ error } />
			) );

	switch ( step ) {
		case ACTIVATION_STEP_REMINDER:
			return (
				<ReminderBanner
					isDismissed={ isDismissed }
					onSubmitSuccess={ handleSubmit }
				>
					{ errorNotice }
				</ReminderBanner>
			);
		case ACTIVATION_STEP_SETUP:
			return <SetupBanner onSubmitSuccess={ handleSubmit } />;
		case ACTIVATION_STEP_SUCCESS:
			return <SuccessBanner />;
		default:
			return null;
	}
}

export default whenActive( { moduleName: 'analytics' } )( ActivationBanner );
