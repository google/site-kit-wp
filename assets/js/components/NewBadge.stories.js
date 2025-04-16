/**
 * NewBadge Component Stories.
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
import NewBadge from './NewBadge';

function Template( args ) {
	return <NewBadge { ...args } />;
}

export const NewBadgeDefault = Template.bind( {} );
NewBadgeDefault.storyName = 'Default';
NewBadgeDefault.args = {
	tooltipTitle: 'This is a tooltip title',
	learnMoreLink: 'https://www.google.com',
};

export const NewBadgeLongTitle = Template.bind( {} );
NewBadgeLongTitle.storyName = 'Long Title';
NewBadgeLongTitle.args = {
	tooltipTitle:
		'This is a tooltip title that is very long and will wrap to multiple lines. This should still display as a single paragraph and the link will be displayed under the title.',
	learnMoreLink: 'https://www.google.com',
};

export const NewBadgeForceOpen = Template.bind( {} );
NewBadgeForceOpen.storyName = 'Force Open';
NewBadgeForceOpen.args = {
	tooltipTitle:
		'This is a tooltip that is forced to be open all the time using the forceOpen prop. This is useful for testing the tooltip in Storybook.',
	learnMoreLink: 'https://www.google.com',
	forceOpen: true,
};
NewBadgeForceOpen.scenario = {};

export default {
	title: 'Components/NewBadge',
	component: NewBadge,
	decorators: [
		( Story ) => (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'flex-end',
					height: '200px',
				} }
			>
				<Story />
			</div>
		),
	],
};
