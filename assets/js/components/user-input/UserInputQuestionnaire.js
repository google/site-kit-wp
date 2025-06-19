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
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_MAX_ANSWERS,
	getUserInputAnswers,
	getUserInputAnswersDescription,
} from './util/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

export default function UserInputQuestionnaire() {
	const viewContext = useViewContext();

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
		trackEvent( gaEventCategory, 'site_purpose_question_view' );
	}, [ gaEventCategory, viewContext ] );

	const { USER_INPUT_ANSWERS_PURPOSE } = getUserInputAnswers();

	const {
		USER_INPUT_ANSWERS_PURPOSE: USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS,
	} = getUserInputAnswersDescription();

	const userInputPurposeConversionEvents = useSelect( ( select ) => {
		const isGA4Connected = select( CORE_MODULES ).isModuleConnected(
			MODULE_SLUG_ANALYTICS_4
		);

		if ( ! isGA4Connected ) {
			return [];
		}

		return select(
			MODULES_ANALYTICS_4
		).getUserInputPurposeConversionEvents();
	} );

	const { setUserInputSetting } = useDispatch( CORE_USER );

	const submitChanges = useCallback( async () => {
		trackEvent( gaEventCategory, 'summary_submit' );

		// Update 'includeConversionEvents' setting with included conversion events,
		// to mark that their respective metrics should be included in the
		// list of tailored metrics and persist on the dashboard in case events are lost.
		setUserInputSetting(
			'includeConversionEvents',
			userInputPurposeConversionEvents
		);

		const response = await saveUserInputSettings();
		if ( ! response.error ) {
			const url = new URL( dashboardURL );
			navigateTo( url.toString() );
		}
	}, [
		gaEventCategory,
		saveUserInputSettings,
		userInputPurposeConversionEvents,
		dashboardURL,
		setUserInputSetting,
		navigateTo,
	] );

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

	return (
		<div>
			<UserInputQuestionWrapper
				slug={ USER_INPUT_QUESTIONS_PURPOSE }
				questionNumber={ 1 }
				complete={ onSaveClick }
				error={ error }
			>
				<UserInputSelectOptions
					slug={ USER_INPUT_QUESTIONS_PURPOSE }
					max={
						USER_INPUT_MAX_ANSWERS[ USER_INPUT_QUESTIONS_PURPOSE ]
					}
					options={ USER_INPUT_ANSWERS_PURPOSE }
					descriptions={ USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS }
					next={ onSaveClick }
					showInstructions
				/>
			</UserInputQuestionWrapper>
		</div>
	);
}
