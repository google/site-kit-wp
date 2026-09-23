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
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Stepper from '@/js/components/Stepper';
import Step from '@/js/components/Stepper/Step';
import { type SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';

interface ExpressSetupStepsProps {
	steps: SetupStep[];
	activeSlug?: string;
}

const ExpressSetupSteps: FC< ExpressSetupStepsProps > = ( {
	steps,
	activeSlug,
} ) => {
	const labels: string[] = useSelect(
		( select: Select ) =>
			steps.map( ( { label } ) =>
				typeof label === 'function' ? label( select ) : label
			),
		[ steps ]
	);

	const activeStep = steps.findIndex( ( { slug } ) => slug === activeSlug );

	return (
		<Stepper activeStep={ activeStep } variant="rail">
			{ steps.map( ( { slug }, index ) => (
				<Step key={ slug } title={ labels[ index ] } />
			) ) }
		</Stepper>
	);
};

export default ExpressSetupSteps;
