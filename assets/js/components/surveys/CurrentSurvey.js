/**
 * CurrentSurvey component.
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

/* eslint complexity: [ "error", 19 ] */

/**
 * External dependencies
 */
import { useMount } from 'react-use';
import { Slide } from '@material-ui/core';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import SurveyCompletion from './SurveyCompletion';
import SurveyQuestionRating from './SurveyQuestionRating';
import SurveyQuestionOpenText from './SurveyQuestionOpenText';
import SurveyQuestionMultiSelect from './SurveyQuestionMultiSelect';
import SurveyQuestionSingleSelect from './SurveyQuestionSingleSelect';
import SurveyTerms from './SurveyTerms';

const SURVEY_ANSWER_DELAY_MS = 300;

const TYPE_MULTI_SELECT = 'multi_select';
const TYPE_OPEN_TEXT = 'open_text';
const TYPE_RATING = 'rating';
const TYPE_SINGLE_SELECT = 'single_select';

const KNOWN_QUESTION_TYPES = [
	TYPE_MULTI_SELECT,
	TYPE_OPEN_TEXT,
	TYPE_RATING,
	TYPE_SINGLE_SELECT,
];

export default function CurrentSurvey() {
	const [ sentSurveyShownEvent, setSentSurveyShownEvent ] = useState( false );
	const [ sentCompletionEvent, setSentCompletionEvent ] = useState( false );
	const [ animateSurvey, setAnimateSurvey ] = useState( false );
	const [ hasAnsweredQuestion, setHasAnsweredQuestion ] = useState( false );

	const completions = useSelect( ( select ) =>
		select( CORE_USER ).getCurrentSurveyCompletions()
	);
	const questions = useSelect( ( select ) =>
		select( CORE_USER ).getCurrentSurveyQuestions()
	);
	const surveySession = useSelect( ( select ) =>
		select( CORE_USER ).getCurrentSurveySession()
	);
	const isTrackingEnabled = useSelect( ( select ) =>
		select( CORE_USER ).isTrackingEnabled()
	);

	const formName = surveySession
		? `survey-${ surveySession.session_id }`
		: null;
	const shouldHide = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( formName, 'hideSurvey' )
	);
	const answers = useSelect(
		( select ) => select( CORE_FORMS ).getValue( formName, 'answers' ) || []
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { sendSurveyEvent } = useDispatch( CORE_USER );

	useEffect( () => {
		if ( questions?.length && ! sentSurveyShownEvent ) {
			setSentSurveyShownEvent( true );
			sendSurveyEvent( 'survey_shown' );
		}
	}, [ questions, sentSurveyShownEvent, sendSurveyEvent ] );

	// We only have trigger conditions for questions that are answered with
	// ordinal values right now.
	const ordinalAnswerMap = answers.reduce(
		( acc, { question_ordinal: ordinal, answer } ) => ( {
			...acc,
			[ ordinal ]: answer.answer.answer_ordinal || answer.answer,
		} ),
		{}
	);

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

	const answerQuestion = useCallback(
		( answer ) => {
			if ( hasAnsweredQuestion ) {
				return;
			}

			setHasAnsweredQuestion( true );
			sendSurveyEvent( 'question_answered', {
				// eslint-disable-next-line camelcase
				question_ordinal: currentQuestion?.question_ordinal,
				answer,
			} );

			setTimeout( () => {
				setValues( formName, {
					answers: [
						...answers,
						{
							// eslint-disable-next-line camelcase
							question_ordinal: currentQuestion?.question_ordinal,
							answer,
						},
					],
				} );

				setHasAnsweredQuestion( false );
			}, SURVEY_ANSWER_DELAY_MS );
		},
		[
			answers,
			currentQuestion,
			formName,
			sendSurveyEvent,
			setValues,
			hasAnsweredQuestion,
		]
	);

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

	const ctaOnClick = useCallback( () => {
		sendSurveyEvent( 'follow_up_link_clicked', {
			completion_ordinal: triggeredCompletion?.completion_ordinal, // eslint-disable-line camelcase
		} );
		sendSurveyEvent( 'survey_closed' );
		setValues( formName, { hideSurvey: true } );
	}, [ formName, sendSurveyEvent, setValues, triggeredCompletion ] );

	const dismissSurvey = useCallback( () => {
		sendSurveyEvent( 'survey_closed' );
		setAnimateSurvey( false );
	}, [ sendSurveyEvent ] );

	const handleAnimationOnExited = useCallback( () => {
		setValues( formName, { hideSurvey: true } );
	}, [ formName, setValues ] );

	useEffect( () => {
		if ( triggeredCompletion && ! sentCompletionEvent ) {
			setSentCompletionEvent( true );
			sendSurveyEvent( 'completion_shown', {
				completion_ordinal: triggeredCompletion?.completion_ordinal, // eslint-disable-line camelcase
			} );
		}
	}, [ sentCompletionEvent, sendSurveyEvent, triggeredCompletion ] );

	useMount( () => {
		setAnimateSurvey( true );
	} );

	if (
		shouldHide ||
		! questions ||
		! completions ||
		isTrackingEnabled === undefined
	) {
		return null;
	}

	if ( triggeredCompletion ) {
		return (
			<Slide
				direction="up"
				in={ animateSurvey }
				onExited={ handleAnimationOnExited }
			>
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
			</Slide>
		);
	}

	// eslint-disable-next-line camelcase
	if ( ! KNOWN_QUESTION_TYPES.includes( currentQuestion?.question_type ) ) {
		return null;
	}

	const commonProps = {
		key: currentQuestion.question_text,
		answerQuestion,
		dismissSurvey,
		question: currentQuestion.question_text,
		submitButtonText:
			questions?.length === currentQuestionOrdinal
				? __( 'Submit', 'google-site-kit' )
				: __( 'Next', 'google-site-kit' ),
	};

	return (
		<Slide
			direction="up"
			in={ animateSurvey }
			onExited={ handleAnimationOnExited }
		>
			<div className="googlesitekit-survey">
				{ currentQuestion.question_type === TYPE_MULTI_SELECT && (
					<SurveyQuestionMultiSelect
						{ ...commonProps }
						choices={ currentQuestion.question.answer_choice }
						minChoices={ currentQuestion.question.min_choices }
						maxChoices={ currentQuestion.question.max_choices }
					/>
				) }
				{ currentQuestion.question_type === TYPE_OPEN_TEXT && (
					<SurveyQuestionOpenText
						{ ...commonProps }
						subtitle={ currentQuestion.question.subtitle }
						placeholder={ currentQuestion.question.placeholder }
					/>
				) }
				{ currentQuestion.question_type === TYPE_RATING && (
					<SurveyQuestionRating
						{ ...commonProps }
						choices={ currentQuestion.question.answer_choice }
					/>
				) }
				{ currentQuestion.question_type === TYPE_SINGLE_SELECT && (
					<SurveyQuestionSingleSelect
						{ ...commonProps }
						choices={ currentQuestion.question.answer_choice }
					/>
				) }

				{ isTrackingEnabled === false &&
					currentQuestion?.question_ordinal === 1 && ( // eslint-disable-line camelcase
						<div className="googlesitekit-survey__footer">
							<SurveyTerms />
						</div>
					) }
			</div>
		</Slide>
	);
}
