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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideCurrentSurvey } from '../../../../tests/js/utils';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import CurrentSurvey from './CurrentSurvey';
import {
	multiQuestionConditionalSurvey,
	multiQuestionSurvey,
	singleQuestionSurvey,
	singleQuestionSurveyWithNoFollowUp,
} from './__fixtures__';

function Template( { setupRegistry, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<CurrentSurvey { ...args } />
		</WithRegistrySetup>
	);
}

export const SurveySingleQuestionStory = Template.bind( {} );
SurveySingleQuestionStory.storyName = 'Single question';
SurveySingleQuestionStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, {
			body: {},
		} );

		provideCurrentSurvey( registry, singleQuestionSurvey );
	},
};
SurveySingleQuestionStory.scenario = {
	label: 'Global/Current Survey/Single question',
	delay: 250,
};

export const SurveyMultipleQuestionsStory = Template.bind( {} );
SurveyMultipleQuestionsStory.storyName = 'Multiple questions';
SurveyMultipleQuestionsStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, {
			body: {},
		} );

		provideCurrentSurvey( registry, multiQuestionSurvey );
	},
};

export const SurveyMultipleQuestionsConditionalStory = Template.bind( {} );
SurveyMultipleQuestionsConditionalStory.storyName = 'Conditional';
SurveyMultipleQuestionsConditionalStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, {
			body: {},
		} );

		provideCurrentSurvey( registry, multiQuestionConditionalSurvey );
	},
};

export const SurveyNotAnsweredNoFollowUpStory = Template.bind( {} );
SurveyNotAnsweredNoFollowUpStory.storyName = 'New survey (no follow-up CTA)';
SurveyNotAnsweredNoFollowUpStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, {
			body: {},
		} );

		provideCurrentSurvey( registry, singleQuestionSurveyWithNoFollowUp );
	},
};

export const SurveyAnsweredPositiveStory = Template.bind( {} );
SurveyAnsweredPositiveStory.storyName = 'Completed';
SurveyAnsweredPositiveStory.args = {
	setupRegistry: ( registry ) => {
		const answer = {
			question_ordinal: 1,
			answer: {
				answer: { answer_ordinal: 5 },
			},
		};

		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, {
			body: {},
		} );

		provideCurrentSurvey( registry, singleQuestionSurvey );

		registry
			.dispatch( CORE_FORMS )
			.setValues( `survey-${ singleQuestionSurvey.session.session_id }`, {
				answers: [ answer ],
			} );
	},
};

export const SurveyWithTermsStory = Template.bind( {} );
SurveyWithTermsStory.storyName = 'With Terms';
SurveyWithTermsStory.args = {
	setupRegistry: ( registry ) => {
		fetchMock.post( /google-site-kit\/v1\/core\/user\/data\/survey-event/, {
			body: {},
		} );

		provideCurrentSurvey( registry, singleQuestionSurvey, {
			trackingEnabled: false,
		} );
	},
};

export default {
	title: 'Components/Surveys/CurrentSurvey',
};
