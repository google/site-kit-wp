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
			title="Modal Dialog Title"
			subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo urna vitae commodo sollicitudin."
			handleConfirm={ () => {} }
			{ ...args }
			dialogActive
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

export const DangerWithStringNote = Template.bind( {} );
DangerWithStringNote.storyName = 'Danger with string note';
DangerWithStringNote.args = {
	notes: [ 'this is a single string note' ],
	provides: [ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
	danger: true,
};
DangerWithStringNote.scenario = {};

function ComponentNote() {
	return (
		<div>
			<strong>Note:</strong> This is a note rendered as a component. It
			can include <a href="https://example.com">HTML links</a> and other
			React components.
		</div>
	);
}
export const DangerWithComponentNote = Template.bind( {} );
DangerWithComponentNote.storyName = 'Danger with component note';
DangerWithComponentNote.args = {
	notes: [ 'This is the first string note.', ComponentNote ],
	provides: [ 'Audience overview', 'Top pages', 'Top acquisition channels' ],
	danger: true,
};
DangerWithComponentNote.scenario = {};

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
