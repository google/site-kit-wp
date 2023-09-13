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
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import UserInputQuestionWrapper from './UserInputQuestionWrapper';
import UserInputSelectOptions from './UserInputSelectOptions';
import UserInputPreview from './UserInputPreview';
import {
	USER_INPUT_QUESTIONS_LIST,
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTIONS_GOALS,
	USER_INPUT_MAX_ANSWERS,
	getUserInputAnswers,
} from './util/constants';
import useQueryArg from '../../hooks/useQueryArg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

const steps = [ ...USER_INPUT_QUESTIONS_LIST, 'preview' ];

export default function UserInputQuestionnaire() {
	const viewContext = useViewContext();
	const [ activeSlug, setActiveSlug ] = useQueryArg( 'question', steps[ 0 ] );
	const [ shouldScrollToActiveQuestion, setShouldScrollToActiveQuestion ] =
		useState( false );
	const [ redirectURL ] = useQueryArg( 'redirect_url' );
	const [ single ] = useQueryArg( 'single', false );

	const activeSlugIndex = steps.indexOf( activeSlug );
	if ( activeSlugIndex === -1 ) {
		setActiveSlug( steps[ 0 ] );
	}

	const { saveUserInputSettings } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const error = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserInputSettings', [] )
	);

	useEffect( () => {
		switch ( activeSlug ) {
			case USER_INPUT_QUESTIONS_PURPOSE:
				trackEvent(
					`${ viewContext }_kmw`,
					'site_purpose_question_view'
				);
				break;
			case USER_INPUT_QUESTION_POST_FREQUENCY:
				trackEvent(
					`${ viewContext }_kmw`,
					'content_frequency_question_view'
				);
				break;
			case USER_INPUT_QUESTIONS_GOALS:
				trackEvent(
					`${ viewContext }_kmw`,
					'site_goals_question_view'
				);
				break;
			case 'preview':
				trackEvent( `${ viewContext }_kmw`, 'summary_view' );
				break;
		}
	}, [ activeSlug, viewContext ] );

	const {
		USER_INPUT_ANSWERS_PURPOSE,
		USER_INPUT_ANSWERS_GOALS,
		USER_INPUT_ANSWERS_POST_FREQUENCY,
	} = getUserInputAnswers();

	const isSettings = single === 'settings';

	const next = useCallback( () => {
		trackEvent(
			`${ viewContext }_kmw`,
			'question_advance',
			steps[ activeSlugIndex ]
		);
		setActiveSlug( steps[ activeSlugIndex + 1 ] );
	}, [ activeSlugIndex, setActiveSlug, viewContext ] );

	const back = useCallback( () => {
		trackEvent(
			`${ viewContext }_kmw`,
			'question_return',
			steps[ activeSlugIndex ]
		);
		setActiveSlug( steps[ activeSlugIndex - 1 ] );
	}, [ activeSlugIndex, setActiveSlug, viewContext ] );

	const submitChanges = useCallback( async () => {
		let eventAction = 'summary_submit';
		let eventLabel;

		if ( isSettings ) {
			eventAction = 'question_update';
			eventLabel = steps[ activeSlugIndex ];
		}

		trackEvent( `${ viewContext }_kmw`, eventAction, eventLabel );

		const response = await saveUserInputSettings();
		if ( ! response.error ) {
			const url = new URL( redirectURL || dashboardURL );
			navigateTo( url.toString() );
		}
	}, [
		dashboardURL,
		isSettings,
		navigateTo,
		redirectURL,
		activeSlugIndex,
		saveUserInputSettings,
		viewContext,
	] );

	useEffect( () => {
		if ( ! shouldScrollToActiveQuestion ) {
			setShouldScrollToActiveQuestion( true );
			return;
		}

		global.document
			?.querySelector( '.googlesitekit-user-input__header' )
			?.scrollIntoView( { behavior: 'smooth' } );
	}, [ activeSlug, shouldScrollToActiveQuestion ] );

	// Update the callbacks and labels for the questions if the user is editing a *single question*.
	let backCallback = back;
	let nextCallback = next;
	let nextLabel;

	if ( single === 'settings' ) {
		backCallback = undefined;
		// When the user is editing a single question from the settings screen, submit changes and send them back to the settings pages when they click Submit.
		nextCallback = submitChanges;
		nextLabel = __( 'Submit', 'google-site-kit' );
	}

	const settingsProgress = (
		<ProgressBar
			height={ 4 }
			indeterminate={ false }
			progress={
				( activeSlugIndex + 1 ) /
				( USER_INPUT_QUESTIONS_LIST.length + 1 ) // +1 here to account for the UserInputPreview screen.
			}
			className="googlesitekit-user-input__question--progress"
		/>
	);

	return (
		<div>
			{ settingsProgress }

			{ activeSlugIndex ===
				steps.indexOf( USER_INPUT_QUESTIONS_PURPOSE ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTIONS_PURPOSE }
					questionNumber={ 1 }
					title={ __(
						'What is the main purpose of this site?',
						'google-site-kit'
					) }
					description={ __(
						'Based on your answer, Site Kit will tailor the metrics you see on your dashboard to help you track progress towards your specific goals.',
						'google-site-kit'
					) }
					next={ nextCallback }
					nextLabel={ nextLabel }
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
						next={ nextCallback }
						showInstructions
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex ===
				steps.indexOf( USER_INPUT_QUESTION_POST_FREQUENCY ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
					questionNumber={ 2 }
					title={ __(
						'How often do you create new content for this site?',
						'google-site-kit'
					) }
					description={ __(
						'Based on your answer, Site Kit will suggest new features for your dashboard related to content creation.',
						'google-site-kit'
					) }
					next={ nextCallback }
					nextLabel={ nextLabel }
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
				steps.indexOf( USER_INPUT_QUESTIONS_GOALS ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTIONS_GOALS }
					questionNumber={ 3 }
					title={ __(
						'What are your top goals for this site?',
						'google-site-kit'
					) }
					description={ __(
						'Based on your answers, Site Kit will tailor the metrics and recommendations you see on your dashboard to help you make progress in these areas.',
						'google-site-kit'
					) }
					next={ nextCallback }
					nextLabel={ nextLabel }
					back={ backCallback }
					error={ error }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTIONS_GOALS }
						max={
							USER_INPUT_MAX_ANSWERS[ USER_INPUT_QUESTIONS_GOALS ]
						}
						options={ USER_INPUT_ANSWERS_GOALS }
						next={ nextCallback }
						showInstructions
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlug === 'preview' && (
				<UserInputPreview
					submitChanges={ submitChanges }
					goBack={ backCallback }
					error={ error }
				/>
			) }
		</div>
	);
}
