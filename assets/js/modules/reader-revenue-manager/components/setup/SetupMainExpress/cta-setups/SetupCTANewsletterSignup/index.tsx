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
import type { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	StepPublicationPolicies,
	StepPublicationSetup,
	StepSetupComplete,
	StepTermsOfService,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import ExpressSetupLayout from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupLayout';
import ExpressSetupSteps from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupSteps';
import { useStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import StepSignupForm from './StepSignupForm';

const SetupCTANewsletterSignup: FC = () => {
	const [ step, setStep ] = useStep();

	const stepContent: Record< string, ReactNode > = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: (
			<StepPublicationSetup
				connectDescription={ __(
					'To set up a newsletter sign-up form using Reader Revenue Manager, connect your publication or create a new one.',
					'google-site-kit'
				) }
				createDescription={ __(
					'To set up a newsletter sign-up form using Reader Revenue Manager, you will need to create a publication.',
					'google-site-kit'
				) }
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
			<StepPublicationPolicies
				description={ __(
					'To set up a newsletter using Reader Revenue Manager, you will need to add links to your publication’s policies.',
					'google-site-kit'
				) }
				onComplete={ () => setStep( EXPRESS_SETUP_STEPS.SETUP_CTA ) }
			/>
		),
		[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: <StepSignupForm />,
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: <StepSetupComplete />,
	};

	return (
		<ExpressSetupLayout
			sidebar={
				<ExpressSetupSteps
					extraSteps={ {
						[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: __(
							'Set up a sign-up form',
							'google-site-kit'
						),
					} }
				/>
			}
		>
			{ step ? stepContent[ step ] : null }
		</ExpressSetupLayout>
	);
};

export default SetupCTANewsletterSignup;
