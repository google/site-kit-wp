/**
 * Reader Revenue Manager survey CTA setup utilities.
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

// The survey configuration uses the field names of the `webcontentpublisher` API.
/* eslint-disable sitekit/acronym-case */

/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import {
	type CustomQuestion,
	type IdentifiedSurveyQuestion,
} from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { type SurveyQuestion as CatalogQuestion } from '@/js/modules/reader-revenue-manager/datastore/types';
import { MAX_PRESET_ANSWERS } from './constants';
import { type CustomSurveyQuestion } from './CustomQuestionSideSheet/types';
import { type SurveyQuestionAnswer } from './SurveyQuestionRow/types';

/**
 * Gets the local ID of a predefined question.
 *
 * @since n.e.x.t
 *
 * @param  questionID ID of the question in the catalog.
 * @return {string} Local ID of the question.
 */
export function getPresetQuestionID( questionID: number ): string {
	return `preset-${ questionID }`;
}

/**
 * Creates a new local ID for a custom question.
 *
 * @since n.e.x.t
 *
 * @return {string} Local ID of the question.
 */
export function createCustomQuestionID(): string {
	return uniqueId( 'custom-question-' );
}

/**
 * Converts a custom question in the API's shape to the shape the custom
 * question side sheet takes.
 *
 * @since n.e.x.t
 *
 * @param  customQuestion Custom question in the API's shape.
 * @return {Object} Custom question for the side sheet.
 */
export function toCustomSurveyQuestion(
	customQuestion: CustomQuestion
): CustomSurveyQuestion {
	return {
		question: customQuestion.displayText || '',
		answers: customQuestion.answerChoices.map(
			( { displayText } ) => displayText
		),
		category: customQuestion.categoryLabel || '',
	};
}

/**
 * Converts a custom question from the custom question side sheet to the API's
 * shape.
 *
 * @since n.e.x.t
 *
 * @param  question Custom question from the side sheet.
 * @return {Object} Custom question in the API's shape.
 */
export function toCustomQuestion(
	question: CustomSurveyQuestion
): CustomQuestion {
	const categoryLabel = question.category?.trim();

	return {
		displayText: question.question,
		answerChoices: question.answers.map( ( displayText ) => ( {
			displayText,
		} ) ),
		...( categoryLabel && { categoryLabel } ),
	};
}

/**
 * Gets the question text of a survey form entry.
 *
 * A predefined question that the catalog does not have has no text. Such
 * entries can reach a render before they are removed from the form.
 *
 * @since n.e.x.t
 *
 * @param  entry   Survey form entry.
 * @param  catalog Survey question catalog.
 * @return {(string|undefined)} Question text; `undefined` if it is not known.
 */
export function getQuestionText(
	entry: IdentifiedSurveyQuestion,
	catalog: CatalogQuestion[] = []
): string | undefined {
	const { customQuestion, presetQuestion } = entry.question;

	if ( customQuestion ) {
		return customQuestion.displayText;
	}

	return catalog.find( ( { id } ) => id === presetQuestion?.questionId )
		?.label;
}

/**
 * Gets the answers of a custom question as `SurveyQuestionRow` answers.
 *
 * Custom answers have no API ID, so their index is used.
 *
 * @since n.e.x.t
 *
 * @param  customQuestion Custom question in the API's shape.
 * @return {Array.<Object>} Answers for `SurveyQuestionRow`.
 */
export function getCustomQuestionAnswers(
	customQuestion: CustomQuestion
): SurveyQuestionAnswer[] {
	return customQuestion.answerChoices.map( ( { displayText }, index ) => ( {
		id: String( index ),
		label: displayText,
	} ) );
}

/**
 * Gets the answers of a catalog question as `SurveyQuestionRow` answers.
 *
 * @since n.e.x.t
 *
 * @param  catalogQuestion Catalog question.
 * @return {Array.<Object>} Answers for `SurveyQuestionRow`.
 */
export function getCatalogQuestionAnswers(
	catalogQuestion: CatalogQuestion
): SurveyQuestionAnswer[] {
	return catalogQuestion.answers.map( ( { id, label } ) => ( {
		id: String( id ),
		label,
	} ) );
}

/**
 * Gets the answers a catalog question offers by default: the first five.
 *
 * @since n.e.x.t
 *
 * @param  catalogQuestion Catalog question.
 * @return {Array.<string>} IDs of the default answers, as strings.
 */
export function getDefaultPresetAnswerIDs(
	catalogQuestion: CatalogQuestion
): string[] {
	return catalogQuestion.answers
		.slice( 0, MAX_PRESET_ANSWERS )
		.map( ( { id } ) => String( id ) );
}

/**
 * Creates a survey form entry for a predefined question.
 *
 * The chosen answers are kept only when the publisher chooses the answers of
 * the question.
 *
 * @since n.e.x.t
 *
 * @param  catalogQuestion Catalog question.
 * @param  answerIDs       IDs of the chosen answers, as strings.
 * @return {Object} Survey form entry.
 */
export function createPresetQuestionEntry(
	catalogQuestion: CatalogQuestion,
	answerIDs: string[] = []
): IdentifiedSurveyQuestion {
	return {
		id: getPresetQuestionID( catalogQuestion.id ),
		question: {
			presetQuestion: {
				questionId: catalogQuestion.id,
				...( catalogQuestion.hasConfigurableAnswers && {
					answerIds: answerIDs.map( Number ),
				} ),
			},
		},
	};
}
