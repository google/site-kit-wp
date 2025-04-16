/**
 * ModalDialog Component Stories.
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
import ModalDialog from './ModalDialog';

function Template( args ) {
	return (
		<ModalDialog
			dialogActive
			title="Modal Dialog Title"
			subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo urna vitae commodo sollicitudin."
			handleConfirm={ () => {} }
			{ ...args }
		/>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const Danger = Template.bind( {} );
Danger.storyName = 'Danger';
Danger.args = {
	title: 'Danger Modal Dialog Title',
	provides: [ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
	danger: true,
};
Danger.scenario = {};

export const DependentModules = Template.bind( {} );
DependentModules.storyName = 'Danger With Dependent Modules';
DependentModules.args = {
	dependentModules:
		'Fusce sit amet tellus neque. Praesent egestas dapibus ipsum vel vulputate.',
	provides: [ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
	danger: true,
};
DependentModules.scenario = {};

export const SmallModal = Template.bind( {} );
SmallModal.storyName = 'Small';
SmallModal.args = {
	small: true,
};
SmallModal.scenario = {};

export const MediumModal = Template.bind( {} );
MediumModal.storyName = 'Medium';
MediumModal.args = {
	medium: true,
};
MediumModal.scenario = {};

export default {
	title: 'Global/Modal Dialog',
	component: ModalDialog,
};
