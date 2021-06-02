/**
 * SurveyCompletion Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import SurveyCompletion from './SurveyCompletion';

const Template = ( args ) => <SurveyCompletion { ...args } />;

export const SurveyCompletionReviewStory = Template.bind( {} );
SurveyCompletionReviewStory.storyName = 'SurveyCompletion: Review';
SurveyCompletionReviewStory.args = {
	children: 'We’re glad Site Kit is helpful for you! To help others discover it too, take a moment to share your opinion as a review.',
	title: 'Thanks for sharing your thoughts!',
	ctaText: 'Let’s go',
	ctaURL: 'https://sitekit.withgoogle.com/',
	ctaOnClick: () => {
		global.console.log( 'Clicked' );
	},
	dismissSurvey: () => {
		global.console.log( 'Dismissed Completed Survey' );
	},
};

export const SurveyCompletionForumStory = Template.bind( {} );
SurveyCompletionForumStory.storyName = 'SurveyCompletion: Forum';
SurveyCompletionForumStory.args = {
	children: 'Do you need help with anything? We’re happy to answer your questions in the forum.',
	title: 'Thanks for sharing your thoughts!',
	ctaText: 'Get help',
	ctaURL: 'https://sitekit.withgoogle.com/',
	ctaOnClick: () => {
		global.console.log( 'Clicked' );
	},
	dismissSurvey: () => {
		global.console.log( 'Dismissed Completed Survey' );
	},
};

export default {
	title: 'Components/Surveys',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-survey">
				<Story />
			</div>
		),
	],
};
