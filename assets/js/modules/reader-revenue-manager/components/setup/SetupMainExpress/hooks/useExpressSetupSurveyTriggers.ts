/**
 * Reader Revenue Manager express setup `useExpressSetupSurveyTriggers` hook.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useEffect } from 'react';
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import { setupCompleteStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepSetupComplete';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import useStep from './useStep';

/**
 * Triggers the express setup surveys for the CTA being set up.
 *
 * Fires the started survey when the express setup is opened for a recognised
 * CTA, and the completed survey once the setup complete step is reached.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export default function useExpressSetupSurveyTriggers(): void {
	const [ cta ] = useQueryArg< string >( 'cta' );
	const [ currentStep ] = useStep();
	const { triggerSurvey } = useDispatch( CORE_USER );

	const isValidCTA = (
		Object.values( EXPRESS_SETUP_CTAS ) as string[]
	 ).includes( cta ?? '' );

	useMount( () => {
		if ( ! isValidCTA ) {
			return;
		}

		triggerSurvey( `rrm_${ cta }_express_setup_started` );
	} );

	useEffect( () => {
		if ( ! isValidCTA || currentStep !== setupCompleteStep.slug ) {
			return;
		}

		triggerSurvey( `rrm_${ cta }_express_setup_completed` );
	}, [ isValidCTA, currentStep, triggerSurvey, cta ] );
}
