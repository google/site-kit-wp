/**
 * Survey Component Stories.
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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import Survey from './Survey';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import * as fixtures from './__fixtures__';
import fetchMock from 'fetch-mock';

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<Survey { ...args } />
	</WithRegistrySetup>
);

export const SurveyNotAnsweredStory = Template.bind( {} );
SurveyNotAnsweredStory.storyName = 'New survey';
SurveyNotAnsweredStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'storybookSurvey' } );
	},
};

export const SurveyNotAnsweredNoFollowUpStory = Template.bind( {} );
SurveyNotAnsweredNoFollowUpStory.storyName = 'New survey (no follow-up CTA)';
SurveyNotAnsweredNoFollowUpStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurveyWithNoFollowUp, { triggerID: 'storybookSurvey' } );
	},
};

export const SurveyAnsweredPositiveStory = Template.bind( {} );
SurveyAnsweredPositiveStory.storyName = 'Completed with Positive Rating';
SurveyAnsweredPositiveStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'storybookSurvey' } );

		registry.dispatch( CORE_FORMS ).setValues(
			`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
			{
				answers: [
					{ question_ordinal: 1, answer_ordinal: 5 },
				],
			}
		);
	},
};

export const SurveyAnsweredNegativeStory = Template.bind( {} );
SurveyAnsweredNegativeStory.storyName = 'Completed with Negative Rating';
SurveyAnsweredNegativeStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, { body: {}, status: 200 } );

		registry.dispatch( CORE_USER ).receiveTriggerSurvey( fixtures.singleQuestionSurvey, { triggerID: 'storybookSurvey' } );

		registry.dispatch( CORE_FORMS ).setValues(
			`survey-${ fixtures.singleQuestionSurvey.session.session_id }`,
			{
				answers: [
					{ question_ordinal: 1, answer_ordinal: 2 },
				],
			}
		);
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
