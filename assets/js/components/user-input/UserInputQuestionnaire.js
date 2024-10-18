/**
 * User Input Questionnaire.
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
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import UserInputQuestionWrapper from './UserInputQuestionWrapper';
import UserInputSelectOptions from './UserInputSelectOptions';
import {
	USER_INPUT_QUESTIONS_LIST,
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTIONS_GOALS,
	USER_INPUT_MAX_ANSWERS,
	getUserInputAnswers,
	FORM_USER_INPUT_QUESTION_NUMBER,
	getUserInputAnswersDescription,
} from './util/constants';
import useQueryArg from '../../hooks/useQueryArg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import ProgressSegments from '../ProgressSegments';

export default function UserInputQuestionnaire() {
	const viewContext = useViewContext();
	const [ activeSlug, setActiveSlug ] = useQueryArg(
		'question',
		USER_INPUT_QUESTIONS_LIST[ 0 ]
	);

	const activeSlugIndex = USER_INPUT_QUESTIONS_LIST.indexOf( activeSlug );
	if ( activeSlugIndex === -1 ) {
		setActiveSlug( USER_INPUT_QUESTIONS_LIST[ 0 ] );
	}

	const { setValues } = useDispatch( CORE_FORMS );
	const questionNumber =
		useSelect( ( select ) =>
			select( CORE_FORMS ).getValue(
				FORM_USER_INPUT_QUESTION_NUMBER,
				'questionNumber'
			)
		) || 1;

	const { saveUserInputSettings } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const error = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserInputSettings', [] )
	);

	const gaEventCategory = `${ viewContext }_kmw`;

	useEffect( () => {
		// Set the event name to track based on the active slug.
		let eventActionName;
		if ( activeSlug === USER_INPUT_QUESTIONS_PURPOSE ) {
			eventActionName = 'site_purpose_question_view';
		}
		if ( activeSlug === USER_INPUT_QUESTION_POST_FREQUENCY ) {
			eventActionName = 'content_frequency_question_view';
		}
		if ( activeSlug === USER_INPUT_QUESTIONS_GOALS ) {
			eventActionName = 'site_goals_question_view';
		}

		if ( eventActionName ) {
			trackEvent( gaEventCategory, eventActionName );
		}
	}, [ activeSlug, gaEventCategory, viewContext ] );

	const {
		USER_INPUT_ANSWERS_PURPOSE,
		USER_INPUT_ANSWERS_GOALS,
		USER_INPUT_ANSWERS_POST_FREQUENCY,
	} = getUserInputAnswers();

	const {
		USER_INPUT_ANSWERS_PURPOSE: USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS,
	} = getUserInputAnswersDescription();

	const scrollToQuestion = () => {
		global.scrollTo( {
			top: 0,
			left: 0,
			behavior: 'smooth',
		} );
	};

	const nextCallback = useCallback( () => {
		trackEvent(
			gaEventCategory,
			'question_advance',
			USER_INPUT_QUESTIONS_LIST[ activeSlugIndex ]
		);
		setActiveSlug( USER_INPUT_QUESTIONS_LIST[ activeSlugIndex + 1 ] );
		setValues( FORM_USER_INPUT_QUESTION_NUMBER, {
			questionNumber: questionNumber + 1,
		} );
		scrollToQuestion();
	}, [
		activeSlugIndex,
		gaEventCategory,
		setActiveSlug,
		setValues,
		questionNumber,
	] );

	const backCallback = useCallback( () => {
		trackEvent(
			gaEventCategory,
			'question_return',
			USER_INPUT_QUESTIONS_LIST[ activeSlugIndex ]
		);
		setActiveSlug( USER_INPUT_QUESTIONS_LIST[ activeSlugIndex - 1 ] );
		setValues( FORM_USER_INPUT_QUESTION_NUMBER, {
			questionNumber: questionNumber - 1,
		} );
		scrollToQuestion();
	}, [
		activeSlugIndex,
		gaEventCategory,
		setActiveSlug,
		setValues,
		questionNumber,
	] );

	const submitChanges = useCallback( async () => {
		trackEvent( gaEventCategory, 'summary_submit' );

		const response = await saveUserInputSettings();
		if ( ! response.error ) {
			const url = new URL( dashboardURL );
			navigateTo( url.toString() );
		}
	}, [ gaEventCategory, saveUserInputSettings, dashboardURL, navigateTo ] );

	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettings()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingUserInputSettings( settings )
	);
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);

	const isScreenLoading = isSavingSettings || isNavigating;

	const onSaveClick = useCallback( () => {
		if ( isScreenLoading ) {
			return;
		}

		submitChanges();
	}, [ isScreenLoading, submitChanges ] );

	const settingsProgress = (
		<ProgressSegments
			currentSegment={ activeSlugIndex + 1 }
			totalSegments={ USER_INPUT_QUESTIONS_LIST.length }
			className="googlesitekit-user-input__question--progress"
		/>
	);

	return (
		<div>
			<div className="googlesitekit-user-input__question-progress">
				{ settingsProgress }
			</div>

			{ activeSlugIndex ===
				USER_INPUT_QUESTIONS_LIST.indexOf(
					USER_INPUT_QUESTIONS_PURPOSE
				) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTIONS_PURPOSE }
					questionNumber={ 1 }
					next={ nextCallback }
					error={ error }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTIONS_PURPOSE }
						max={
							USER_INPUT_MAX_ANSWERS[
								USER_INPUT_QUESTIONS_PURPOSE
							]
						}
						options={ USER_INPUT_ANSWERS_PURPOSE }
						descriptions={ USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS }
						next={ nextCallback }
						showInstructions
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex ===
				USER_INPUT_QUESTIONS_LIST.indexOf(
					USER_INPUT_QUESTION_POST_FREQUENCY
				) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
					questionNumber={ 2 }
					next={ nextCallback }
					back={ backCallback }
					error={ error }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
						max={
							USER_INPUT_MAX_ANSWERS[
								USER_INPUT_QUESTION_POST_FREQUENCY
							]
						}
						options={ USER_INPUT_ANSWERS_POST_FREQUENCY }
						next={ nextCallback }
						showInstructions
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex ===
				USER_INPUT_QUESTIONS_LIST.indexOf(
					USER_INPUT_QUESTIONS_GOALS
				) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTIONS_GOALS }
					questionNumber={ 3 }
					complete={ onSaveClick }
					back={ backCallback }
					error={ error }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTIONS_GOALS }
						max={
							USER_INPUT_MAX_ANSWERS[ USER_INPUT_QUESTIONS_GOALS ]
						}
						options={ USER_INPUT_ANSWERS_GOALS }
						next={ onSaveClick }
						showInstructions
					/>
				</UserInputQuestionWrapper>
			) }
		</div>
	);
}
