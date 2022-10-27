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
import { useCallback, Fragment, useEffect, useState } from '@wordpress/element';
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
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTIONS_GOALS,
	getUserInputAnswers,
} from './util/constants';
import useQueryArg from '../../hooks/useQueryArg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { Cell, Row } from '../../material-components';
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
	const [ single, setSingle ] = useQueryArg( 'single', false );

	const activeSlugIndex = steps.indexOf( activeSlug );
	if ( activeSlugIndex === -1 ) {
		setActiveSlug( steps[ 0 ] );
	}

	const { saveUserInputSettings } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const { isSavingSettings, error, answeredUntilIndex } = useSelect(
		( select ) => {
			const userInputSettings =
				select( CORE_USER ).getUserInputSettings();

			return {
				isSavingSettings:
					select( CORE_USER ).isSavingUserInputSettings(
						userInputSettings
					),
				error: select( CORE_USER ).getErrorForAction(
					'saveUserInputSettings',
					[]
				),
				answeredUntilIndex: USER_INPUT_QUESTIONS_LIST.findIndex(
					( question ) =>
						userInputSettings?.[ question ]?.values?.length === 0
				),
			};
		}
	);

	useEffect( () => {
		if ( answeredUntilIndex === -1 ) {
			return;
		}
		if ( activeSlugIndex > answeredUntilIndex ) {
			setActiveSlug( steps[ answeredUntilIndex ] );
		}
	}, [ answeredUntilIndex, activeSlugIndex, setActiveSlug ] );

	useEffect( () => {
		if ( activeSlug === 'preview' ) {
			trackEvent( viewContext, 'summary_view' );
		}
	}, [ activeSlug, viewContext ] );

	const {
		USER_INPUT_ANSWERS_PURPOSE,
		USER_INPUT_ANSWERS_GOALS,
		USER_INPUT_ANSWERS_POST_FREQUENCY,
	} = getUserInputAnswers();

	const isSettings = single === 'settings';

	const next = useCallback( () => {
		trackEvent( viewContext, 'question_advance', steps[ activeSlugIndex ] );
		setActiveSlug( steps[ activeSlugIndex + 1 ] );
	}, [ activeSlugIndex, setActiveSlug, viewContext ] );

	const goTo = useCallback(
		( num = 1, singleType = false ) => {
			trackEvent( viewContext, 'question_edit', steps[ num - 1 ] );

			// If we're going to a single question to edit it, set the query string here.
			// We can't currently set it in the child component because the useQueryArg hook doesn't update in the parent.
			setSingle( singleType );
			if ( steps.length >= num && num > 0 ) {
				setActiveSlug( steps[ num - 1 ] );
			}
		},
		[ setActiveSlug, setSingle, viewContext ]
	);

	const back = useCallback( () => {
		trackEvent( viewContext, 'question_return', steps[ activeSlugIndex ] );
		setActiveSlug( steps[ activeSlugIndex - 1 ] );
	}, [ activeSlugIndex, setActiveSlug, viewContext ] );

	const submitChanges = useCallback( async () => {
		let eventAction = 'summary_submit';
		let eventLabel;

		if ( isSettings ) {
			eventAction = 'question_update';
			eventLabel = steps[ activeSlugIndex ];
		}

		trackEvent( viewContext, eventAction, eventLabel );

		const response = await saveUserInputSettings();
		if ( ! response.error ) {
			const url = new URL( redirectURL || dashboardURL );

			// Here we don't use `addQueryArgs` due to a bug with how it handles hashes
			// See https://github.com/WordPress/gutenberg/issues/16655
			url.searchParams.set( 'notification', 'user_input_success' );

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

	const goToPreview = useCallback( () => {
		trackEvent( viewContext, 'question_update', steps[ activeSlugIndex ] );
		setActiveSlug( steps[ steps.length - 1 ] );
	}, [ activeSlugIndex, setActiveSlug, viewContext ] );

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

	if ( single === 'user-input' ) {
		backCallback = undefined;
		// When the user is editing a single question in the user-input screen send them back to the preview when they click Update.
		nextCallback = goToPreview;
		nextLabel = __( 'Update', 'google-site-kit' );
	} else if ( single === 'settings' ) {
		backCallback = undefined;
		// When the user is editing a single question from the settings screen, submit changes and send them back to the settings pages when they click Submit.
		nextCallback = submitChanges;
		nextLabel = __( 'Submit', 'google-site-kit' );
	}

	const settingsProgress = (
		<ProgressBar
			height={ 0 }
			indeterminate={ false }
			progress={
				( activeSlugIndex + 1 ) / USER_INPUT_QUESTIONS_LIST.length
			}
			className="googlesitekit-user-input__question--progress"
		/>
	);

	if ( isSavingSettings || isNavigating ) {
		return (
			<Fragment>
				{ settingsProgress }
				<div className="googlesitekit-user-input__preview">
					<Row>
						<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
							<ProgressBar />
						</Cell>
					</Row>
				</div>
			</Fragment>
		);
	}

	return (
		<div>
			{ settingsProgress }

			{ activeSlugIndex <=
				steps.indexOf( USER_INPUT_QUESTIONS_PURPOSE ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTIONS_PURPOSE }
					isActive={ activeSlug === USER_INPUT_QUESTIONS_PURPOSE }
					questionNumber={ 1 }
					title={ __(
						'What is the main purpose of this site?',
						'google-site-kit'
					) }
					description={ __(
						'Based on your answer, Site Kit will tailor the metrics you see on your dashboard to help you track how close you’re getting to your specific goals',
						'google-site-kit'
					) }
					next={ nextCallback }
					nextLabel={ nextLabel }
					back={ backCallback }
					error={ error }
				>
					<UserInputSelectOptions
						isActive={ activeSlug === USER_INPUT_QUESTIONS_PURPOSE }
						slug={ USER_INPUT_QUESTIONS_PURPOSE }
						options={ USER_INPUT_ANSWERS_PURPOSE }
						next={ nextCallback }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <=
				steps.indexOf( USER_INPUT_QUESTION_POST_FREQUENCY ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
					isActive={
						activeSlug === USER_INPUT_QUESTION_POST_FREQUENCY
					}
					questionNumber={ 2 }
					title={ __(
						'How often do you create new content for this site?',
						'google-site-kit'
					) }
					description={ __(
						'Based on your answer, Site Kit will suggest new features for your dashboard related to content creation',
						'google-site-kit'
					) }
					next={ nextCallback }
					nextLabel={ nextLabel }
					back={ backCallback }
					error={ error }
				>
					<UserInputSelectOptions
						isActive={
							activeSlug === USER_INPUT_QUESTION_POST_FREQUENCY
						}
						slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
						options={ USER_INPUT_ANSWERS_POST_FREQUENCY }
						next={ nextCallback }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <=
				steps.indexOf( USER_INPUT_QUESTIONS_GOALS ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTIONS_GOALS }
					isActive={ activeSlug === USER_INPUT_QUESTIONS_GOALS }
					questionNumber={ 3 }
					title={ __(
						'What are your top goals for this site?',
						'google-site-kit'
					) }
					description={ __(
						'Based on your answers, Site Kit will tailor the metrics and advice you see on your dashboard to help you make progress in these areas',
						'google-site-kit'
					) }
					next={ nextCallback }
					nextLabel={ nextLabel }
					back={ backCallback }
					error={ error }
				>
					<UserInputSelectOptions
						isActive={ activeSlug === USER_INPUT_QUESTIONS_GOALS }
						slug={ USER_INPUT_QUESTIONS_GOALS }
						max={ 3 }
						options={ USER_INPUT_ANSWERS_GOALS }
						next={ nextCallback }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlug === 'preview' && (
				<UserInputPreview
					submitChanges={ submitChanges }
					goTo={ goTo }
					error={ error }
				/>
			) }
		</div>
	);
}
