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
import useQueryArg from '@/js/hooks/useQueryArg';
import {
	StepPublicationPolicies,
	StepPublicationSetup,
	StepSetupComplete,
	StepTermsOfService,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import ExpressSetupLayout from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupLayout';
import ExpressSetupSteps from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupSteps';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import StepSignupForm from './StepSignupForm';

const SetupCTANewsletterSignup: FC = () => {
	const [ step, setStep ] = useQueryArg( 'step' );

	const stepConfig: Record<
		string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{ Component: FC< any >; nextStep?: string }
	> = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: {
			Component: StepPublicationSetup,
			nextStep: EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE,
		},
		[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: {
			Component: StepTermsOfService,
			nextStep: EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES,
		},
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: {
			Component: StepPublicationPolicies,
			nextStep: EXPRESS_SETUP_STEPS.SETUP_CTA,
		},
		[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: {
			Component: StepSignupForm,
			nextStep: EXPRESS_SETUP_STEPS.SETUP_COMPLETE,
		},
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: {
			Component: StepSetupComplete,
		},
	};

	const { Component, nextStep } = stepConfig[ step ] ?? {};

	return (
		<ExpressSetupLayout
			sidebar={
				<ExpressSetupSteps
					step={ step }
					extraSteps={ {
						[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: __(
							'Set up a sign-up form',
							'google-site-kit'
						),
					} }
				/>
			}
		>
			{ Component && (
				<Component onSetStep={ setStep } nextStep={ nextStep } />
			) }
		</ExpressSetupLayout>
	);
};

export default SetupCTANewsletterSignup;
