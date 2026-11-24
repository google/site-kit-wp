/**
 * Reader Revenue Manager survey question catalog fixture.
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
import { type SurveyQuestion } from '@/js/modules/reader-revenue-manager/datastore/types';

// The catalog as `getSurveyQuestionCatalog()` returns it. The first question
// has more than five configurable answers, so only five are chosen by default.
const surveyQuestionCatalog: SurveyQuestion[] = [
	{
		id: 4,
		label: 'Which topics are you most interested in?',
		answers: [
			{ id: 1, label: 'Politics' },
			{ id: 2, label: 'Business' },
			{ id: 3, label: 'Sports' },
			{ id: 4, label: 'Technology' },
			{ id: 5, label: 'Entertainment' },
			{ id: 6, label: 'Health' },
			{ id: 7, label: 'Travel' },
		],
		hasConfigurableAnswers: true,
	},
	{
		id: 1,
		label: 'What is your age?',
		answers: [
			{ id: 1, label: 'Under 18' },
			{ id: 2, label: '18-24' },
			{ id: 3, label: '25-34' },
			{ id: 4, label: '35-44' },
			{ id: 5, label: '45-54' },
			{ id: 6, label: '55-64' },
			{ id: 7, label: '65 or older' },
		],
		hasConfigurableAnswers: false,
	},
	{
		id: 7,
		label: 'How often do you read our content?',
		answers: [
			{ id: 1, label: 'Every day' },
			{ id: 2, label: 'A few times a week' },
			{ id: 3, label: 'Rarely' },
		],
		hasConfigurableAnswers: true,
	},
	{
		id: 2,
		label: 'What is your gender?',
		answers: [
			{ id: 1, label: 'Female' },
			{ id: 2, label: 'Male' },
			{ id: 3, label: 'Non-binary' },
			{ id: 4, label: 'Prefer not to say' },
		],
		hasConfigurableAnswers: false,
	},
];

export default surveyQuestionCatalog;
