/**
 * Survey fixtures.
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
export const invalidQuestionTypeSurvey = {
	survey_payload: {
		completion: [
			{
				completion_ordinal: 1,
				completion_title: 'Thanks for sharing your thoughts!',
				completion_text: 'We’re glad Site Kit is helpful for you! To help others discover it too, take a moment to share your opinion as a review.',
				follow_up_text: 'Let’s go',
				follow_up_url: '#new-url',
				trigger_condition: [
					{
						question_ordinal: 1,
						answer_ordinal: [ 1, 2, 3, 4, 5 ],
					},
				],
			},
		],
		question: [
			{
				question_ordinal: 1,
				question_text: 'Based on your experience so far, how satisfied are you with Site Kit?',
				question_type: 'unknown',
				question: {
					answer_choice: [
						{
							answer_ordinal: 1,
							text: 'Unhappy',
						},
						{
							answer_ordinal: 5,
							text: 'Delighted',
						},
					],
				},
			},
		],
	},
	session: {
		session_id: 'storybook_session',
		session_token: 'token_12345',
	},
};

export const multiQuestionSurvey = {
	survey_payload: {
		completion: [
			{
				completion_ordinal: 1,
				completion_title: 'You answered positively!',
				completion_text: 'Because you picked answer 4 or 5 we showed this completion. Cool!',
				follow_up_text: 'Let’s go',
				follow_up_url: '#new-url',
				trigger_condition: [
					{
						question_ordinal: 1,
						answer_ordinal: [ 4, 5 ],
					},
				],
			},
			{
				completion_ordinal: 2,
				completion_title: 'You are seeing this because you did not answer the first question positively.',
				completion_text: 'Thanks for completing the survey!',
				follow_up_text: 'Get help',
				follow_up_url: '#new-url-2',
				trigger_condition: [
					{
						question_ordinal: 2,
						answer_ordinal: [ 1, 2, 3, 4, 5 ],
					},
				],
			},
		],
		question: [
			{
				question_ordinal: 1,
				question_text: 'If you are really happy, this survey will show a different completion!',
				question_type: 'rating',
				question: {
					answer_choice: [
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
				},
			},
			{
				question_ordinal: 2,
				question_text: 'Another question: how do you feel when it rains?',
				question_type: 'rating',
				question: {
					answer_choice: [
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
				},
			},
			{
				question_ordinal: 3,
				question_text: 'Another question: how do you feel when it is sunny?',
				question_type: 'rating',
				question: {
					answer_choice: [
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
				},
			},
			{
				question_ordinal: 4,
				question_text: 'Another question: how do you feel when it is overcast?',
				question_type: 'rating',
				question: {
					answer_choice: [
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
				},
			},
		],
	},
	session: {
		session_id: 'storybook_session',
		session_token: 'token_12345',
	},
};

export const singleQuestionSurvey = {
	survey_payload: {
		completion: [
			{
				completion_ordinal: 1,
				completion_title: 'Thanks for sharing your thoughts!',
				completion_text: 'We’re glad Site Kit is helpful for you! To help others discover it too, take a moment to share your opinion as a review.',
				follow_up_text: 'Let’s go',
				follow_up_url: '#new-url',
				trigger_condition: [
					{
						question_ordinal: 1,
						answer_ordinal: [ 4, 5 ],
					},
				],
			},
			{
				completion_ordinal: 2,
				completion_title: 'Thanks for sharing your thoughts!',
				completion_text: 'Do you need help with anything? We’re happy to answer your questions in the forum.',
				follow_up_text: 'Get help',
				follow_up_url: '#new-url-2',
				trigger_condition: [
					{
						question_ordinal: 1,
						answer_ordinal: [ 1, 2, 3 ],
					},
				],
			},
		],
		question: [
			{
				question_ordinal: 1,
				question_text: 'Based on your experience so far, how satisfied are you with Site Kit?',
				question_type: 'rating',
				question: {
					answer_choice: [
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
				},
			},
		],
	},
	session: {
		session_id: 'storybook_session',
		session_token: 'token_12345',
	},
};

export const singleQuestionSurveyWithNoFollowUp = {
	survey_payload: {
		completion: [
			{
				completion_ordinal: 1,
				completion_title: 'Thanks for the ranking!',
				completion_text: 'No further questions; this message will now self-destruct.',
				trigger_condition: [
					{
						question_ordinal: 1,
						answer_ordinal: [ 1, 2, 3, 4, 5 ],
					},
				],
			},
		],
		question: [
			{
				question_ordinal: 1,
				question_text: 'Based on your experience so far, how satisfied are you with Site Kit?',
				question_type: 'rating',
				question: {
					answer_choice: [
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
				},
			},
		],
	},
	session: {
		session_id: 'storybook_session',
		session_token: 'token_12345',
	},
};
