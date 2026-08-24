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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import {
	StepPublicationPolicies,
	StepPublicationSetup,
	StepSetupComplete,
	StepTermsOfService,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import ExpressSetupLayout from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupLayout';
import ExpressSetupSteps from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupSteps';
import {
	EXPRESS_SETUP_STEPS,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import StepSignupForm from './StepSignupForm';

interface CoreFormsStore {
	getValue( formName: string, key: string ): unknown;
}

const SetupCTANewsletterSignup: FC = () => {
	const [ step ] = useQueryArg( 'step' );
	const showPublicationCreate = useSelect(
		( select: Select ) =>
			( select( CORE_FORMS ) as unknown as CoreFormsStore ).getValue(
				READER_REVENUE_MANAGER_SETUP_FORM,
				SHOW_PUBLICATION_CREATE
			),
		[]
	);

	const stepContent: Record< string, ReactNode > = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: <StepPublicationSetup />,
		...( showPublicationCreate === true
			? {
					[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: (
						<StepTermsOfService />
					),
			  }
			: {} ),
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: (
			<StepPublicationPolicies />
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
