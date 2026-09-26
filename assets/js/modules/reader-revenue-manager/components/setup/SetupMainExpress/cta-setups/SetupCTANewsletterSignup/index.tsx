/**
 * Reader Revenue Manager newsletter signup CTA express setup flow.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	publicationPoliciesStep,
	publicationSetupStep,
	setupCompleteStep,
	termsOfServiceStep,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import ExpressSetupLayout from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupLayout';
import ExpressSetupSteps from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupSteps';
import { useSetupFlow } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import { SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import StepSetupCompleteNewsletterSignup from './StepSetupCompleteNewsletterSignup';
import { signupFormStep } from './StepSignupForm';
import ViewOnSiteCTA from './ViewOnSiteCTA';

const STEPS: SetupStep[] = [
	publicationSetupStep,
	termsOfServiceStep,
	publicationPoliciesStep,
	signupFormStep,
	setupCompleteStep,
];

const SetupCTANewsletterSignup: FC = () => {
	const { currentStep, advance } = useSetupFlow( STEPS );

	// Copy this flow overrides on the shared steps, keyed by step slug.
	const stepProps: Record< string, object > = {
		[ publicationSetupStep.slug ]: {
			connectDescription: __(
				'To set up a newsletter sign-up form using Reader Revenue Manager, connect your publication or create a new one.',
				'google-site-kit'
			),
			createDescription: __(
				'To set up a newsletter sign-up form using Reader Revenue Manager, you will need to create a publication.',
				'google-site-kit'
			),
		},
		[ publicationPoliciesStep.slug ]: {
			description: __(
				'To set up a newsletter using Reader Revenue Manager, you will need to add links to your publication’s policies.',
				'google-site-kit'
			),
		},
		[ setupCompleteStep.slug ]: {
			title: __(
				'Your newsletter signup form is ready!',
				'google-site-kit'
			),
			secondaryCTA: <ViewOnSiteCTA />,
			children: <StepSetupCompleteNewsletterSignup />,
		},
	};

	const StepComponent = currentStep?.Component;

	return (
		<ExpressSetupLayout
			sidebar={
				<ExpressSetupSteps
					steps={ STEPS }
					activeSlug={ currentStep?.slug }
				/>
			}
		>
			{ StepComponent ? (
				<StepComponent
					{ ...stepProps[ currentStep.slug ] }
					onComplete={ advance }
				/>
			) : null }
		</ExpressSetupLayout>
	);
};

export default SetupCTANewsletterSignup;
