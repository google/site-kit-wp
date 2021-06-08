/**
 * SurveyQuestionRating Component Stories.
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
import SurveyQuestionRating from './SurveyQuestionRating';

const Template = ( args ) => <SurveyQuestionRating { ...args } />;

export const SurveyQuestionRatingStory = Template.bind( {} );
SurveyQuestionRatingStory.storyName = 'SurveyQuestionRating';
SurveyQuestionRatingStory.args = {
	question: 'Based on your experience so far, how satisfied are you with Site Kit?',
	choices: [
		{
			answer_ordinal: 1,
			text: 'Unhappy',
		},
		{
			answer_ordinal: 2,
			text: 'Dissatisfied',
		},
		{
			answer_ordinal: 3,
			text: 'Neutral',
		},
		{
			answer_ordinal: 4,
			text: 'Satisfied',
		},
		{
			answer_ordinal: 5,
			text: 'Delighted',
		},
	],
	answerQuestion: ( answer ) => {
		global.console.log( 'Clicked', answer );
	},
	dismissSurvey: () => {
		global.console.log( 'Dismissed Survey' );
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
