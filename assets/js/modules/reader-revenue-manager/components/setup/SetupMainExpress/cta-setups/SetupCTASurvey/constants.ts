/**
 * Reader Revenue Manager survey CTA constants.
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
import { type IdentifiedSurveyQuestion } from '@/js/modules/reader-revenue-manager/datastore/cta-types';

// Keys of the survey form, `EXPRESS_SETUP_CTA_FORMS.SURVEY`, which the survey
// setup steps share.
export const SURVEY_FORM = {
	SELECTED_QUESTIONS: 'selectedQuestions',
	DISPLAY_NAME: 'displayName',
	SURVEY_TEXT: 'surveyText',
} as const;

export interface SurveyFormValues {
	// The selected questions, in the order they appear in the survey.
	[ SURVEY_FORM.SELECTED_QUESTIONS ]?: IdentifiedSurveyQuestion[];
	// The CTA name, sent as the CTA's `displayName`.
	[ SURVEY_FORM.DISPLAY_NAME ]?: string;
	// The survey text, sent as `config.customMessage`.
	[ SURVEY_FORM.SURVEY_TEXT ]?: string;
}
