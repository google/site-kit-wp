/**
 * Chip Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Chip from './Chip';

function Template( args ) {
	return <Chip { ...args } />;
}

export const DefaultChip = Template.bind( {} );
DefaultChip.storyName = 'Default Chip';
DefaultChip.args = {
	id: 'default',
	label: 'Default Chip',
};

export const SelectedChip = Template.bind( {} );
SelectedChip.storyName = 'Selected Chip';
SelectedChip.args = {
	id: 'selected',
	label: 'Selected Chip',
	selected: true,
};

export const DisabledChip = Template.bind( {} );
DisabledChip.storyName = 'Disabled Chip';
DisabledChip.args = {
	id: 'disabled',
	label: 'Disabled Chip',
	disabled: true,
};

export default {
	title: 'Components/Chip',
	component: Chip,
};
