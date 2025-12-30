/**
 * CurrentSurvey component.
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
 * External dependencies
 */
import { useMount } from 'react-use';
import { Slide } from '@material-ui/core';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import SurveyCompletion from '@/js/components/surveys/SurveyCompletion';
import SurveyTerms from '@/js/components/surveys/SurveyTerms';
import SurveyQuestion from './SurveyQuestion';
import {
	getCurrentQuestionAndOrdinal,
	getTriggeredCompletion,
	isLastQuestion,
} from './utils';
import { SURVEY_QUESTION_TYPE } from './constants';
import useFormValue from '@/js/hooks/useFormValue';

const SURVEY_ANSWER_DELAY_MS = 300;
const defaultAnswers = Object.freeze( [] );

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
	const shouldHide = useFormValue( formName, 'hideSurvey' );
	const answers = useFormValue( formName, 'answers' ) || defaultAnswers;

	const { setValues } = useDispatch( CORE_FORMS );
	const { sendSurveyEvent } = useDispatch( CORE_USER );

	useEffect( () => {
		if ( questions?.length && ! sentSurveyShownEvent ) {
			setSentSurveyShownEvent( true );
			sendSurveyEvent( 'survey_shown' );
		}
	}, [ questions, sentSurveyShownEvent, sendSurveyEvent ] );

	const { currentQuestion, currentQuestionOrdinal } =
		getCurrentQuestionAndOrdinal( questions, answers );

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

	const triggeredCompletion = getTriggeredCompletion(
		questions,
		answers,
		completions,
		currentQuestionOrdinal
	);

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
	if (
		! Object.values( SURVEY_QUESTION_TYPE ).includes(
			currentQuestion?.question_type
		)
	) {
		return null;
	}

	return (
		<Slide
			direction="up"
			in={ animateSurvey }
			onExited={ handleAnimationOnExited }
		>
			<div className="googlesitekit-survey">
				<SurveyQuestion
					currentQuestion={ currentQuestion }
					answerQuestion={ answerQuestion }
					dismissSurvey={ dismissSurvey }
					isLastQuestion={ isLastQuestion(
						questions,
						currentQuestion
					) }
				/>
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
