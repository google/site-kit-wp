/**
 * SurveyQuestionMultiSelect Component Stories.
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
import SurveyQuestionMultiSelect from './SurveyQuestionMultiSelect';

function Template( args ) {
	return (
		<div className="googlesitekit-survey">
			<SurveyQuestionMultiSelect { ...args } />
		</div>
	);
}

export const SurveyQuestionMultiSelectStory = Template.bind( {} );
SurveyQuestionMultiSelectStory.storyName = 'SurveyQuestionMultiSelect';
SurveyQuestionMultiSelectStory.args = {
	question: 'What are your favorite pizza toppings?',
	choices: [
		{
			answer_ordinal: 1,
			text: 'Pepperoni',
		},
		{
			answer_ordinal: 2,
			text: 'Mushrooms',
		},
		{
			answer_ordinal: 3,
			text: 'Sausage',
		},
		{
			answer_ordinal: 4,
			text: 'Black Olives',
		},
		{
			answer_ordinal: 5,
			text: 'All of the above',
		},
		{
			answer_ordinal: 6,
			text: 'Other',
			write_in: true,
		},
	],
	minChoices: 2,
	maxChoices: 4,
	submitButtonText: 'Next',
	answerQuestion: ( answer ) => {
		global.console.log( 'Clicked', answer );
	},
	dismissSurvey: () => {
		global.console.log( 'Dismissed Survey' );
	},
};

export default {
	title: 'Components/Surveys/SurveyQuestionMultiSelect',
};
