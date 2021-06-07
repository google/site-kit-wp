/**
 * Survey component.
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
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import SurveyCompletion from './SurveyCompletion';
import SurveyQuestionRating from './SurveyQuestionRating';
const { useDispatch, useSelect } = Data;

const ComponentMap = {
	rating: SurveyQuestionRating,
};

const CurrentSurvey = () => {
	const [ hasSentSurveyShownEvent, setHasSentSurveyShownEvent ] = useState( false );
	const [ hasSentCompletionEvent, setHasSentCompletionEvent ] = useState( false );

	useEffect( () => {
		if ( questions?.length && ! hasSentSurveyShownEvent ) {
			setHasSentSurveyShownEvent( true );
			sendSurveyEvent( 'survey_shown' );
		}
	}, [ questions, hasSentSurveyShownEvent, sendSurveyEvent ] );

	const completions = useSelect( ( select ) => select( CORE_USER ).getCurrentSurveyCompletions() );
	const questions = useSelect( ( select ) => select( CORE_USER ).getCurrentSurveyQuestions() );
	const surveySession = useSelect( ( select ) => select( CORE_USER ).getCurrentSurveySession() );

	const formName = surveySession ? `survey-${ surveySession.session_id }` : null;

	const answers = useSelect( ( select ) => select( CORE_FORMS ).getValue( formName, 'answers' ) );

	const currentQuestionOrdinal = Math.max( 0, ...( answers || [] ).map( ( a ) => a.question_ordinal ) ) + 1;

	const shouldHide = useSelect( ( select ) => select( CORE_FORMS ).getValue( formName, 'hideSurvey' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const { sendSurveyEvent } = useDispatch( CORE_USER );

	const currentQuestion = questions?.find( ( question ) => {
		return question.question_ordinal === currentQuestionOrdinal;
	} );

	const answerQuestion = useCallback( ( answer ) => {
		sendSurveyEvent( 'question_answered', {
			// eslint-disable-next-line camelcase
			question_ordinal: currentQuestion?.question_ordinal,
			answer,
		} );

		setValues( formName, {
			answers: [
				...answers || [],
				{
					// eslint-disable-next-line camelcase
					question_ordinal: currentQuestion?.question_ordinal,
					answer,
				},
			],
		} );
	}, [ answers, currentQuestion, formName, sendSurveyEvent, setValues ] );

	const ctaOnClick = useCallback( () => {
		sendSurveyEvent( 'follow_up_link_clicked' );
		sendSurveyEvent( 'survey_closed' );

		setValues( formName, { hideSurvey: true } );
	}, [ formName, sendSurveyEvent, setValues ] );

	const dismissSurvey = useCallback( () => {
		sendSurveyEvent( 'survey_closed' );

		setValues( formName, { hideSurvey: true } );
	}, [ formName, sendSurveyEvent, setValues ] );

	// Check to see if a completion trigger has been met.
	let triggeredCompletion;
	// We only have trigger conditions for questions that are answered with
	// ordinal values right now.
	const ordinalAnswerMap = answers?.length ? answers.reduce( ( acc, answer ) => {
		return {
			...acc,
			[ answer.question_ordinal ]: answer.answer.answer.answer_ordinal,
		};
	}, {} ) : [];

	if ( questions?.length && currentQuestionOrdinal > questions?.length ) {
		// Use Array.some to avoid looping through all completions; once the first
		// matching completion has been found, treat the survey as complete.
		completions?.some( ( completion ) => {
			completion.trigger_condition.some( ( condition ) => {
				// If a question was answered with the appropriate value, a completion
				// trigger has been fulfilled and we should treat this survey as
				// complete.
				if ( condition.answer_ordinal.includes( ordinalAnswerMap[ condition.question_ordinal ] ) ) { // eslint-disable-line camelcase
					triggeredCompletion = completion;
					return true;
				}

				return false;
			} );

			if ( triggeredCompletion ) {
				return true;
			}

			return false;
		} );

		// If no specific trigger has been found but all questions are answered, use
		// the first available trigger.
		if ( ! triggeredCompletion ) {
			triggeredCompletion = completions[ 0 ];
		}
	}

	useEffect( () => {
		if ( triggeredCompletion && ! hasSentCompletionEvent ) {
			setHasSentCompletionEvent( true );
			sendSurveyEvent( 'completion_shown', {
				completion_ordinal: triggeredCompletion.completion_ordinal,
			} );
		}
	}, [ hasSentCompletionEvent, sendSurveyEvent, triggeredCompletion ] );

	if ( shouldHide || ! questions || ! completions ) {
		return null;
	}

	if ( triggeredCompletion ) {
		return (
			<div className="googlesitekit-survey">
				<SurveyCompletion
					dismissSurvey={ dismissSurvey }
					ctaOnClick={ ctaOnClick }
					ctaText={ triggeredCompletion.follow_up_text }
					ctaURL={ triggeredCompletion.follow_up_url }
					title={ triggeredCompletion.completion_title }
				>
					{ triggeredCompletion.completion_text }
				</SurveyCompletion>
			</div>
		);
	}

	// eslint-disable-next-line camelcase
	const SurveyQuestionComponent = ComponentMap[ currentQuestion?.question_type ];

	if ( ! SurveyQuestionComponent ) {
		return null;
	}

	return (
		<div className="googlesitekit-survey">
			<SurveyQuestionComponent
				answerQuestion={ answerQuestion }
				choices={ currentQuestion.question.answer_choice }
				dismissSurvey={ dismissSurvey }
				key={ currentQuestion.question_ordinal }
				question={ currentQuestion.question_text }
			/>
		</div>
	);
};

CurrentSurvey.propTypes = {};

export default CurrentSurvey;
