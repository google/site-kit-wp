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

const defaultArgs = {
	dialogActive: true,
	title: 'Modal Dialog Title',
	subtitle:
		'Modal Dialog Subtitle. It will adjust the width based on default value.',
	handleConfirm: () =>
		global.console.log.bind( null, 'Dialog::handleConfirm' ),
};

function Template( args ) {
	return <ModalDialog { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = defaultArgs;
Default.scenario = {
	label: 'Global/ModalDialog',
};

export const Danger = Template.bind( {} );
Danger.storyName = 'Danger';
Danger.args = {
	...defaultArgs,
	title: 'Danger/Error Modal Dialog Title',
	provides: [ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
	danger: true,
};
Danger.scenario = {
	label: 'Global/ModalDialog/Danger',
};

export const DependentModules = Template.bind( {} );
DependentModules.storyName = 'Danger With DependentModules Text';
DependentModules.args = {
	...defaultArgs,
	subtitle:
		'Longer subtitle text for modal dialog. It will adjust to the size prop.',
	dependentModules: 'Depend modules text',
	provides: [ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
	danger: true,
};
DependentModules.scenario = {
	label: 'Global/ModalDialog/DangerWithDependentModules',
};

export const SmallModal = Template.bind( {} );
SmallModal.storyName = 'Small Width Modal';
SmallModal.args = {
	...defaultArgs,
	subtitle:
		'Longer subtitle text for modal dialog. It will adjust to the size prop.',
	small: true,
};
SmallModal.scenario = {
	label: 'Global/ModalDialog/Small',
};

export const MediumModal = Template.bind( {} );
MediumModal.storyName = 'Medium Width Modal';
MediumModal.args = {
	...defaultArgs,
	subtitle:
		'Longer subtitle text for modal dialog. It will adjust to the size prop.',
	medium: true,
};
MediumModal.scenario = {
	label: 'Global/ModalDialog/Medium',
};

export default {
	title: 'Global/Modal Dialog',
	component: ModalDialog,
};
