/**
 * ThumbsSurveyTrigger stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';
import { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import { provideSiteInfo, provideUserAuthentication } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ThumbsSurveyTrigger from './ThumbsSurveyTrigger';

function Template( args: ComponentProps< typeof ThumbsSurveyTrigger > ) {
	return <ThumbsSurveyTrigger { ...args } />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';

export const Feedback = Template.bind( {} ) as Story;
Feedback.storyName = 'Feedback';
Feedback.args = {
	feedbackOptions: {
		down: [
			{
				id: 'not_relevant',
				label: 'It’s not relevant to my site goals',
				value: 'not_relevant',
			},
			{
				id: 'already_using',
				label: 'I’m already using another tool',
				value: 'already_using',
			},
			{
				id: 'too_complicated',
				label: 'Setup seems complex',
				value: 'too_complicated',
			},
			{
				id: 'something_else',
				label: 'Something else',
				value: 'something_else',
			},
		],
	},
};

export default {
	title: 'Components/Surveys/ThumbsSurveyTrigger',
	component: ThumbsSurveyTrigger,
	args: {
		voteID: 'example',
		popperPlacement: 'top-start',
	},
	parameters: { padding: '300px 24px 24px' },
	decorators: [
		( StoryComponent: Story ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				fetchMock.post(
					/^\/google-site-kit\/v1\/core\/user\/data\/survey-trigger/,
					{ body: {} },
					{ overwriteRoutes: true }
				);
				provideSiteInfo( registry );
				provideUserAuthentication( registry );
				registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
			}
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
