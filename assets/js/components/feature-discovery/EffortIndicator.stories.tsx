/**
 * EffortIndicator stories.
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
import { Fragment } from 'react';

/**
 * Internal dependencies
 */
import { FEATURE_EFFORTS } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Story } from '@/js/types/Story';
import EffortIndicator from './EffortIndicator';

function Template() {
	return (
		<Fragment>
			<EffortIndicator effort={ FEATURE_EFFORTS.LOW } />
			<EffortIndicator effort={ FEATURE_EFFORTS.MEDIUM } />
			<EffortIndicator effort={ FEATURE_EFFORTS.HIGH } />
		</Fragment>
	);
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'EffortIndicator';
Default.scenario = {};

export default {
	title: 'Components/Feature Discovery/EffortIndicator',
	component: EffortIndicator,
};
