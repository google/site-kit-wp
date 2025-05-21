/**
 * CurrentSurvey utility tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import {
	getCurrentQuestionAndOrdinal,
	getTriggeredCompletion,
	isLastQuestion,
} from './utils';
import {
	singleQuestionSurvey,
	multiQuestionSurvey,
	multiQuestionConditionalSurvey,
} from '../__fixtures__';

describe( 'CurrentSurvey utils', () => {
	describe( 'getCurrentQuestionAndOrdinal', () => {
		it( 'should return the first question when no answers exist', () => {
			const questions = singleQuestionSurvey.survey_payload.question;
			const answers = [];

			const { currentQuestion, currentQuestionOrdinal } =
				getCurrentQuestionAndOrdinal( questions, answers );

			expect( currentQuestion ).toBe( questions[ 0 ] );
			expect( currentQuestionOrdinal ).toBe( 1 );
		} );

		it( 'should return the next sequential question based on previous answers', () => {
			const questions = multiQuestionSurvey.survey_payload.question;
			const answers = [
				{
					question_ordinal: 1,
					answer: { answer: { answer_ordinal: 1 } },
				},
			];

			const { currentQuestion, currentQuestionOrdinal } =
				getCurrentQuestionAndOrdinal( questions, answers );

			expect( currentQuestion ).toBe( questions[ 1 ] );
			expect( currentQuestionOrdinal ).toBe( 2 );
		} );

		it( 'should handle conditional questions based on trigger conditions', () => {
			const questions =
				multiQuestionConditionalSurvey.survey_payload.question;
			const answers = [
				{
					question_ordinal: 1,
					answer: { answer: { answer_ordinal: 4 } },
				},
			];

			const { currentQuestion, currentQuestionOrdinal } =
				getCurrentQuestionAndOrdinal( questions, answers );

			// Verify that the third question is returned when the first answer matches the trigger condition.
			expect( currentQuestion ).toBe( questions[ 2 ] );
			expect( currentQuestionOrdinal ).toBe( 3 );
		} );

		it( 'should skip questions when trigger conditions are not met', () => {
			const questions =
				multiQuestionConditionalSurvey.survey_payload.question;
			const answers = [
				{
					question_ordinal: 1,
					answer: { answer: { answer_ordinal: 3 } },
				},
			];

			const { currentQuestion, currentQuestionOrdinal } =
				getCurrentQuestionAndOrdinal( questions, answers );

			// Verify that the remaining questions are skipped since the third answer doesn't match any trigger conditions.
			expect( currentQuestion ).toBeUndefined();
			// Note that the ordinal is incremented for each condition check that fails.
			expect( currentQuestionOrdinal ).toBe( 4 );
		} );

		it( 'should handle multiple-choice answers in trigger conditions', () => {
			const questions =
				multiQuestionConditionalSurvey.survey_payload.question;
			const answers = [
				{
					question_ordinal: 1,
					answer: {
						answer: [
							{ answer_ordinal: 1 },
							{ answer_ordinal: 2 },
						],
					},
				},
			];

			const { currentQuestion, currentQuestionOrdinal } =
				getCurrentQuestionAndOrdinal( questions, answers );

			// Verify that the second question is returned since the answers include 1 and 2.
			expect( currentQuestion ).toBe( questions[ 1 ] );
			expect( currentQuestionOrdinal ).toBe( 2 );
		} );
	} );

	describe( 'getTriggeredCompletion', () => {
		it( 'should return undefined when the survey is incomplete', () => {
			const { question: questions, completion: completions } =
				singleQuestionSurvey.survey_payload;
			const answers = [];
			const currentQuestionOrdinal = 1;

			const triggeredCompletion = getTriggeredCompletion(
				questions,
				answers,
				completions,
				currentQuestionOrdinal
			);

			expect( triggeredCompletion ).toBeUndefined();
		} );

		it( 'should return the matching completion when trigger conditions are met', () => {
			const { question: questions, completion: completions } =
				singleQuestionSurvey.survey_payload;
			const answers = [
				{
					question_ordinal: 1,
					answer: { answer: { answer_ordinal: 5 } },
				},
			];
			const currentQuestionOrdinal = 2; // Past the last question.

			const triggeredCompletion = getTriggeredCompletion(
				questions,
				answers,
				completions,
				currentQuestionOrdinal
			);

			expect( triggeredCompletion ).toBe( completions[ 0 ] );
		} );

		it( 'should return the first completion when no trigger conditions are met', () => {
			const { question: questions, completion: completions } =
				singleQuestionSurvey.survey_payload;
			const answers = [
				{
					question_ordinal: 1,
					answer: { answer: { answer_ordinal: 6 } },
				},
			];
			const currentQuestionOrdinal = 2; // Past the last question.

			const triggeredCompletion = getTriggeredCompletion(
				questions,
				answers,
				completions,
				currentQuestionOrdinal
			);

			expect( triggeredCompletion ).toBe( completions[ 0 ] );
		} );
	} );

	describe( 'isLastQuestion', () => {
		it( 'should return true for a single question survey', () => {
			const questions = singleQuestionSurvey.survey_payload.question;
			const currentQuestion = questions[ 0 ];

			expect( isLastQuestion( questions, currentQuestion ) ).toBe( true );
		} );

		it( 'should return false for questions referenced by trigger conditions', () => {
			const questions =
				multiQuestionConditionalSurvey.survey_payload.question;
			const firstQuestion = questions[ 0 ];

			expect( isLastQuestion( questions, firstQuestion ) ).toBe( false );
		} );

		it( 'should return true for questions not referenced by trigger conditions', () => {
			const questions =
				multiQuestionConditionalSurvey.survey_payload.question;
			const lastQuestion = questions[ questions.length - 1 ];

			expect( isLastQuestion( questions, lastQuestion ) ).toBe( true );
		} );

		it( 'should handle conditional questions correctly', () => {
			const questions =
				multiQuestionConditionalSurvey.survey_payload.question;
			const firstQuestion = questions[ 0 ];
			const secondQuestion = questions[ 1 ];

			// Verify that the first question is not the last question since it is referenced in trigger conditions.
			expect( isLastQuestion( questions, firstQuestion ) ).toBe( false );
			// Verify that the second question is the last question since it has no trigger conditions referencing it.
			expect( isLastQuestion( questions, secondQuestion ) ).toBe( true );
		} );
	} );
} );
