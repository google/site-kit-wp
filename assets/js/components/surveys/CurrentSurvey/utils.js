/**
 * CurrentSurvey utility functions.
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
 * Gets the current question and its ordinal.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} questions The questions in the survey.
 * @param {Object[]} answers   The answers to the questions.
 * @return {Object} The current question and its ordinal.
 */
export function getCurrentQuestionAndOrdinal( questions, answers ) {
	const ordinalAnswerMap = createOrdinalAnswerMap( answers );

	let currentQuestionOrdinal =
		Math.max( 0, ...answers.map( ( answer ) => answer.question_ordinal ) ) +
		1;

	const currentQuestion = questions?.find( ( question ) => {
		const {
			question_ordinal: questionOrdinal,
			trigger_condition: conditions,
		} = question;

		// Ignore questions that have ordinal lower than the current one.
		if ( questionOrdinal < currentQuestionOrdinal ) {
			return false;
		}

		if ( Array.isArray( conditions ) && conditions.length > 0 ) {
			for ( const condition of conditions ) {
				// Get the answer for the question in the condition and return
				// early if there is no answer for that question yet.
				const answer = ordinalAnswerMap[ condition.question_ordinal ];
				if ( ! answer ) {
					currentQuestionOrdinal++;
					return false;
				}

				// If we have the answer, check if it is one of the expected answers
				// for the condition.
				const allowedAnswers = condition.answer_ordinal || [];

				// If the answer is a single number, we check whether it is in the
				// allowed answers and return early if it is not.
				if (
					! Array.isArray( answer ) &&
					! allowedAnswers.includes( answer )
				) {
					currentQuestionOrdinal++;
					return false;
				}

				// If the answer is multiple-choice, check whether any of its values
				// is in the allowed answers and return early if none of answer values
				// are included in the allowed answers list.
				if ( Array.isArray( answer ) ) {
					const hasAnswers = answer.some(
						( { answer_ordinal: answerOrdinal } ) =>
							allowedAnswers.includes( answerOrdinal )
					);

					if ( ! hasAnswers ) {
						currentQuestionOrdinal++;
						break;
					}
				}
			}
		}

		return questionOrdinal === currentQuestionOrdinal;
	} );

	return { currentQuestion, currentQuestionOrdinal };
}

/**
 * Gets the triggered completion.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} questions              The questions in the survey.
 * @param {Object[]} answers                The answers to the questions.
 * @param {Object[]} completions            The completions in the survey.
 * @param {number}   currentQuestionOrdinal The ordinal of the current question.
 * @return {Object} The triggered completion.
 */
export function getTriggeredCompletion(
	questions,
	answers,
	completions,
	currentQuestionOrdinal
) {
	const ordinalAnswerMap = createOrdinalAnswerMap( answers );

	// Check to see if a completion trigger has been met.
	let triggeredCompletion;
	if ( questions?.length && currentQuestionOrdinal > questions.length ) {
		triggeredCompletion = ( completions || [] ).find( ( completion ) => {
			const conditions = completion.trigger_condition || [];

			for ( const condition of conditions ) {
				// If a question was answered with the appropriate value, a completion
				// trigger has been fulfilled and we should treat this survey as
				// complete.
				if (
					condition.answer_ordinal.includes(
						ordinalAnswerMap[ condition.question_ordinal ]
					)
				) {
					// eslint-disable-line camelcase
					triggeredCompletion = completion;
					return true;
				}
			}

			return false;
		} );

		// If no specific trigger has been found but all questions are answered, use
		// the first available trigger.
		if ( ! triggeredCompletion ) {
			triggeredCompletion = completions[ 0 ];
		}
	}

	return triggeredCompletion;
}

/**
 * Checks if the current question is the last question in the survey.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} questions       The questions in the survey.
 * @param {Object}   currentQuestion The current question.
 * @return {boolean} Whether the current question is the last question in the survey.
 */
export function isLastQuestion( questions, currentQuestion ) {
	// To properly determine the submit button label, we need to check if the current
	// question is the last question in the survey. This is done by checking if
	// there are any trigger conditions that reference the current question. If
	// there are no trigger conditions, it means that the current question is the
	// last question in the survey.
	return (
		questions.some( ( { trigger_condition: conditions } ) => {
			if ( ! Array.isArray( conditions ) || conditions.length === 0 ) {
				return false;
			}

			return conditions.some(
				( condition ) =>
					condition.question_ordinal ===
					currentQuestion.question_ordinal
			);
		} ) === false
	);
}

/**
 * Creates a map of question ordinals to answers.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} answers The answers to the questions.
 * @return {Object} The map of question ordinals to answers.
 */
function createOrdinalAnswerMap( answers ) {
	return answers.reduce(
		( acc, { question_ordinal: ordinal, answer } ) => ( {
			...acc,
			[ ordinal ]: answer.answer.answer_ordinal || answer.answer,
		} ),
		{}
	);
}
