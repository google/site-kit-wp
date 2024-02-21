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
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SetupBanner from './SetupBanner';
import SuccessBanner from './SuccessBanner';
import {
	ACTIVATION_STEP_SETUP,
	ACTIVATION_STEP_SUCCESS,
	GA4_ACTIVATION_BANNER_STATE_KEY,
} from '../../../constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE } from '../../../datastore/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import whenActive from '../../../../../util/when-active';

const { useSelect, useDispatch, useRegistry } = Data;

function ActivationBanner() {
	const [ step, setStep ] = useState( null );

	const registry = useRegistry();

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const returnToSetupStep = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			GA4_ACTIVATION_BANNER_STATE_KEY,
			'returnToSetupStep'
		)
	);

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

	const handleSubmit = useCallback( () => {
		if ( ! returnToSetupStep && step === ACTIVATION_STEP_SETUP ) {
			setStep( ACTIVATION_STEP_SUCCESS );
		}

		return { dismissOnCTAClick: false };
	}, [ step, returnToSetupStep ] );

	switch ( step ) {
		case ACTIVATION_STEP_SETUP:
			return <SetupBanner onSubmitSuccess={ handleSubmit } />;
		case ACTIVATION_STEP_SUCCESS:
			return <SuccessBanner />;
		default:
			return null;
	}
}

export default whenActive( { moduleName: 'analytics-4' } )( ActivationBanner );
