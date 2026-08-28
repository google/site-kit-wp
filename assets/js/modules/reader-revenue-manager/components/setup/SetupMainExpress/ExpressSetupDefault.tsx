/**
 * Reader Revenue Manager default express setup flow without a CTA step.
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
import type { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	StepPublicationPolicies,
	StepPublicationSetup,
	StepSetupComplete,
	StepTermsOfService,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import { useStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import ExpressSetupLayout from './ExpressSetupLayout';
import ExpressSetupSteps from './ExpressSetupSteps';

const ExpressSetupDefault: FC = () => {
	const [ step, setStep ] = useStep();

	const stepContent: Record< string, ReactNode > = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: (
			<StepPublicationSetup
				onComplete={ ( hasAcceptedTerms: boolean ) =>
					setStep(
						hasAcceptedTerms
							? EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES
							: EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE
					)
				}
			/>
		),
		[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: <StepTermsOfService />,
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: (
			<StepPublicationPolicies onSetStep={ () => {} } />
		),
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: <StepSetupComplete />,
	};

	return (
		<ExpressSetupLayout sidebar={ <ExpressSetupSteps step={ step } /> }>
			{ step ? stepContent[ step ] : null }
		</ExpressSetupLayout>
	);
};

export default ExpressSetupDefault;
