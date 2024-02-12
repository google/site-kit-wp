/**
 * SurveyQuestionOpenText Component Stories.
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
import SurveyQuestionOpenText from './SurveyQuestionOpenText';

function Template( args ) {
	return (
		<div className="googlesitekit-survey">
			<SurveyQuestionOpenText { ...args } />
		</div>
	);
}

export const SurveyQuestionOpenTextStory = Template.bind( {} );
SurveyQuestionOpenTextStory.storyName = 'SurveyQuestionOpenText';
SurveyQuestionOpenTextStory.args = {
	question:
		'Based on your experience so far, how satisfied are you with Site Kit?',
	placeholder: 'Enter your comments here',
	subtitle: "Don't include personal information",
	submitButtonText: 'Submit',
	answerQuestion: ( answer ) => {
		global.console.log( 'Clicked', answer );
	},
	dismissSurvey: () => {
		global.console.log( 'Dismissed Survey' );
	},
};
