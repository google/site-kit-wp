/**
 * Radio Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { Radio } from 'googlesitekit-components';

function Template( args ) {
	const { description, ...rest } = args;
	return <Radio { ...rest }>{ description }</Radio>;
}

export const Default = Template.bind( {} );
Default.args = { description: 'Default' };

export const Checked = Template.bind( {} );
Checked.args = {
	checked: true,
	description: 'Checked',
};

export const Disabled = Template.bind( {} );
Disabled.args = {
	disabled: true,
	description: 'Disabled',
};

export function VRTStory() {
	return (
		<div>
			<div>
				<Default { ...Default.args } />
			</div>
			<div>
				<Checked { ...Checked.args } />
			</div>
			<div>
				<Disabled { ...Disabled.args } />
			</div>
		</div>
	);
}

VRTStory.storyName = 'All Radios VRT';
VRTStory.scenario = {};

export default {
	title: 'Components/Radio',
};
