/**
 * Reader Revenue Manager express setup main component.
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
 * Internal dependencies
 */
import useQueryArg from '@/js/hooks/useQueryArg';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import SetupCTANewsletter from './SetupCTANewsletter';
import StepPublicationPolicies from './StepPublicationPolicies';
import StepPublicationSetup from './StepPublicationSetup';
import StepSetupComplete from './StepSetupComplete';
import StepTermsOfService from './StepTermsOfService';

export default function SetupMainExpress() {
	const [ cta ] = useQueryArg( 'cta' );
	const [ step ] = useQueryArg( 'step' );

	const stepComponents = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: StepPublicationSetup,
		[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: StepTermsOfService,
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: StepPublicationPolicies,
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: StepSetupComplete,
		[ EXPRESS_SETUP_STEPS.SETUP_CTA ]:
			cta === EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
				? SetupCTANewsletter
				: StepPublicationSetup,
	};

	const StepComponent = stepComponents[ step ] || StepPublicationSetup;

	return <StepComponent />;
}
