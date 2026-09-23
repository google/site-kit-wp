/**
 * FeedbackMenu stories.
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
import { Story } from '@/js/types/Story';
import FeedbackMenu from './FeedbackMenu';

function Template() {
	return (
		<div className="mdc-menu-surface--anchor">
			<FeedbackMenu
				id="feedback-menu"
				onClose={ () => {} }
				options={ [
					{ id: 'hide', label: 'Just hide this suggestion' },
					{
						id: 'not-relevant',
						label: 'It’s not relevant to my site goals',
						value: 'not_relevant',
					},
					{
						id: 'already-using',
						label: 'I’m already using another tool',
						value: 'already_using',
					},
					{
						id: 'too-complicated',
						label: 'Setup seems complex',
						value: 'too_complicated',
					},
				] }
				isOpen
			/>
		</div>
	);
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'FeedbackMenu';
Default.parameters = {
	pseudo: {
		hover: [ '.mdc-list-item:first-child' ],
	},
};
Default.scenario = {};

export default {
	title: 'Components/Surveys/FeedbackMenu',
	component: FeedbackMenu,
};
