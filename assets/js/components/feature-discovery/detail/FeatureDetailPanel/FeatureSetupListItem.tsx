/**
 * FeatureSetupListItem component.
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_BODY } from '@/js/components/Typography/constants';
import { FeatureSetupListStep } from '@/js/googlesitekit/datastore/feature-discovery/types';

interface FeatureSetupListItemProps {
	step: ReactNode | FeatureSetupListStep;
}

function hasSubSteps(
	step: ReactNode | FeatureSetupListStep
): step is FeatureSetupListStep {
	return typeof step === 'object' && step !== null && 'subSteps' in step;
}

const FeatureSetupListItem: FC< FeatureSetupListItemProps > = ( { step } ) => {
	if ( ! hasSubSteps( step ) ) {
		return (
			<Typography as="li" size={ SIZE_MEDIUM } type={ TYPE_BODY }>
				{ step }
			</Typography>
		);
	}

	const { label, subSteps } = step;

	return (
		<Typography as="li" size={ SIZE_MEDIUM } type={ TYPE_BODY }>
			{ label }
			<ul className="googlesitekit-feature-details-panel__setup-list-sub-steps">
				{ subSteps.map( ( subStep, index ) => (
					<Typography
						as="li"
						key={ index }
						size={ SIZE_MEDIUM }
						type={ TYPE_BODY }
					>
						{ subStep }
					</Typography>
				) ) }
			</ul>
		</Typography>
	);
};

export default FeatureSetupListItem;
