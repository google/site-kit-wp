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
import { Select, useSelect } from 'googlesitekit-data';
import Stepper from '@/js/components/Stepper';
import Step from '@/js/components/Stepper/Step';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import useQueryArg from '@/js/hooks/useQueryArg';
import {
	EXPRESS_SETUP_STEPS,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

interface ExpressSetupStepsProps {
	extraSteps?: Record< string, string >;
}

interface CoreFormsStore {
	getValue( formName: string, key: string ): unknown;
}

const ExpressSetupSteps: FC< ExpressSetupStepsProps > = ( {
	extraSteps = {},
} ) => {
	const [ step ] = useQueryArg( 'step' );
	const showPublicationCreate = useSelect(
		( select: Select ) =>
			( select( CORE_FORMS ) as unknown as CoreFormsStore ).getValue(
				READER_REVENUE_MANAGER_SETUP_FORM,
				SHOW_PUBLICATION_CREATE
			),
		[]
	);

	const steps = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: __(
			'Connect publication',
			'google-site-kit'
		),
		...( showPublicationCreate === true
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
