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
import useQueryArg from '@/js/hooks/useQueryArg';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	StepPublicationPolicies,
	StepPublicationSetup,
	StepSetupComplete,
	StepTermsOfService,
} from './common-steps';
import ExpressSetupLayout from './ExpressSetupLayout';
import ExpressSetupSteps from './ExpressSetupSteps';

const SetupCTANewsletter: FC = () => {
	const [ step ] = useQueryArg( 'step' );

	const stepContent: Record< string, ReactNode > = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: <StepPublicationSetup />,
		[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: <StepTermsOfService />,
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: (
			<StepPublicationPolicies />
		),
		[ EXPRESS_SETUP_STEPS.SETUP_CTA ]: (
			<p>
				{ __(
					'RRM express setup placeholder: newsletter CTA setup step.',
					'google-site-kit'
				) }
			</p>
		),
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: <StepSetupComplete />,
	};

	return (
		<ExpressSetupLayout
			sidebar={
				<ExpressSetupSteps
					setupCTAStepTitle={ __(
						'Set up a sign-up form',
						'google-site-kit'
					) }
				/>
			}
		>
			{ stepContent[ step ] }
		</ExpressSetupLayout>
	);
};

export default SetupCTANewsletter;
