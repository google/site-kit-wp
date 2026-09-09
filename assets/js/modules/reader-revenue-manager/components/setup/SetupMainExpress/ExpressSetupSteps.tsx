/**
 * Reader Revenue Manager express setup steps component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Stepper from '@/js/components/Stepper';
import Step from '@/js/components/Stepper/Step';
import useFormValue from '@/js/hooks/useFormValue';
import { useStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import {
	EXPRESS_SETUP_STEPS,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

interface ExpressSetupStepsProps {
	extraSteps?: Record< string, string >;
}

const ExpressSetupSteps: FC< ExpressSetupStepsProps > = ( {
	extraSteps = {},
} ) => {
	const [ showPublicationCreate ] = useFormValue< boolean >(
		READER_REVENUE_MANAGER_SETUP_FORM,
		SHOW_PUBLICATION_CREATE
	);

	const [ step ] = useStep();

	const showTermsOfServiceStep =
		showPublicationCreate || step === EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE;

	const steps = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: showPublicationCreate
			? __( 'Create publication', 'google-site-kit' )
			: __( 'Connect publication', 'google-site-kit' ),
		...( showTermsOfServiceStep
			? {
					[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: __(
						'Accept terms of service',
						'google-site-kit'
					),
			  }
			: {} ),
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: __(
			'Add publication policies',
			'google-site-kit'
		),
		...extraSteps,
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: __(
			'Setup complete',
			'google-site-kit'
		),
	};

	const activeStep = step ? Object.keys( steps ).indexOf( step ) : -1;

	return (
		<Stepper activeStep={ activeStep } variant="rail">
			{ Object.entries( steps ).map( ( [ stepID, stepTitle ] ) => (
				<Step key={ stepID } title={ stepTitle } />
			) ) }
		</Stepper>
	);
};

export default ExpressSetupSteps;
