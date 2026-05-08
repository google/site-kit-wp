/**
 * Change badge Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import ChangeBadge from './ChangeBadge';

function Template( args ) {
	return (
		<div style={ { display: 'flex' } }>
			<ChangeBadge { ...args } />
		</div>
	);
}

export const Positive = Template.bind( {} );
Positive.storyName = 'Positive';
Positive.args = {
	previousValue: 26,
	currentValue: 51.5,
};

export const Negative = Template.bind( {} );
Negative.storyName = 'Negative';
Negative.args = {
	previousValue: 51,
	currentValue: 25,
};

export const ZeroChange = Template.bind( {} );
ZeroChange.storyName = 'ZeroChange';
ZeroChange.args = {
	previousValue: 1,
	currentValue: 1,
};

export default {
	title: 'Components/ChangeBadge',
	component: ChangeBadge,
};
