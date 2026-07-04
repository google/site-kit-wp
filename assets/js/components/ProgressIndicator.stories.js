/**
 * ProgressIndicator component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import ProgressIndicator from './ProgressIndicator';

function Template( args ) {
	return <ProgressIndicator { ...args } />;
}

export const Initial = Template.bind( {} );
Initial.storyName = '1. Initial state';
Initial.args = {};
Initial.scenario = {};

export const Started = Template.bind( {} );
Started.storyName = '2. Started';
Started.args = {
	currentSegment: 0,
	totalSegments: 3,
};
Started.scenario = {};

export const Progressing = Template.bind( {} );
Progressing.storyName = '3. Progressing';
Progressing.args = {
	currentSegment: 1,
	totalSegments: 3,
};

export const Completed = Template.bind( {} );
Completed.storyName = '4. Completed';
Completed.args = {
	currentSegment: 2,
	totalSegments: 3,
};
Completed.scenario = {};

export default {
	title: 'Components/ProgressIndicator',
	component: ProgressIndicator,
};
