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
 * Internal dependencies
 */
import { FEATURE_EFFORTS } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Story } from '@/js/types/Story';
import EffortIndicator, { EffortIndicatorProps } from './EffortIndicator';

function Template( args: EffortIndicatorProps ) {
	return <EffortIndicator { ...args } />;
}

export const Low = Template.bind( {} ) as Story< EffortIndicatorProps >;
Low.storyName = 'Just a few clicks';
Low.args = { effort: FEATURE_EFFORTS.LOW };
Low.scenario = {};

export const Medium = Template.bind( {} ) as Story< EffortIndicatorProps >;
Medium.storyName = 'A short setup';
Medium.args = { effort: FEATURE_EFFORTS.MEDIUM };
Medium.scenario = {};

export const High = Template.bind( {} ) as Story< EffortIndicatorProps >;
High.storyName = 'In depth setup';
High.args = { effort: FEATURE_EFFORTS.HIGH };
High.scenario = {};

export default {
	title: 'Components/Feature Discovery/EffortIndicator',
	component: EffortIndicator,
};
