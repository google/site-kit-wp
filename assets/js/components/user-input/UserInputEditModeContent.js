/**
 * User Input Edit Mode Content.
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
 * WordPress dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import { Fragment, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useDispatch, useSelect } from 'googlesitekit-data';
import ErrorNotice from '../ErrorNotice';
import useViewContext from '../../hooks/useViewContext';
import { trackEvent } from '../../util';
import UserInputQuestionAuthor from './UserInputQuestionAuthor';
import UserInputSelectOptions from './UserInputSelectOptions';
import { getErrorMessageForAnswer, hasErrorForAnswer } from './util/validation';
import {
	getUserInputAnswersDescription,
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_MAX_ANSWERS,
	USER_INPUT_QUESTIONS_PURPOSE,
} from './util/constants';

export default function UserInputEditModeContent( {
	onChange,
	options,
	settingsView,
	slug,
	values,
} ) {
	const answerHasError = hasErrorForAnswer( values );
	const currentlyEditingSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_INPUT_CURRENTLY_EDITING_KEY )
	);
	const editButtonRef = useRef();
	const errorMessage = getErrorMessageForAnswer(
		values,
		USER_INPUT_MAX_ANSWERS[ slug ]
	);
	const gaEventCategory = `${ useViewContext() }_kmw`;
	const hasSettingChanged = useSelect( ( select ) =>
		select( CORE_USER ).hasUserInputSettingChanged( slug )
	);
	const isEditing = currentlyEditingSlug === slug;
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const isSavingSettings = useSelect( ( select ) => {
		const userInputSettings = select( CORE_USER ).getUserInputSettings();
		return select( CORE_USER ).isSavingUserInputSettings(
			userInputSettings
		);
	} );
	const isScreenLoading = isSavingSettings || isNavigating;
	const saveSettingsError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserInputSettings', [] )
	);
	const { resetUserInputSettings, saveUserInputSettings } =
		useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_UI );
	const {
		USER_INPUT_ANSWERS_PURPOSE: USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS,
	} = getUserInputAnswersDescription();

	const toggleEditMode = useCallback( () => {
		if ( isEditing ) {
			setValues( { [ USER_INPUT_CURRENTLY_EDITING_KEY ]: undefined } );
			editButtonRef.current?.focus?.();
		} else {
			trackEvent( gaEventCategory, 'question_edit', slug );
			setValues( { [ USER_INPUT_CURRENTLY_EDITING_KEY ]: slug } );
		}
	}, [ gaEventCategory, isEditing, setValues, slug ] );

	const handleOnCancelClick = useCallback( async () => {
		if ( isScreenLoading ) {
			return;
		}
		await resetUserInputSettings();
		toggleEditMode();
	}, [ isScreenLoading, resetUserInputSettings, toggleEditMode ] );

	const submitChanges = useCallback( async () => {
		if ( answerHasError ) {
			return;
		}

		if ( USER_INPUT_QUESTIONS_PURPOSE === slug && onChange ) {
			onChange();
		} else {
			const response = await saveUserInputSettings();
			if ( ! response.error ) {
				trackEvent( gaEventCategory, 'question_update', slug );
				toggleEditMode();
			}
		}
	}, [
		answerHasError,
		gaEventCategory,
		onChange,
		saveUserInputSettings,
		slug,
		toggleEditMode,
	] );

	return (
		<Fragment>
			<UserInputSelectOptions
				slug={ slug }
				max={ USER_INPUT_MAX_ANSWERS[ slug ] }
				options={ options }
				alignLeftOptions
				descriptions={ USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS }
			/>
			{ errorMessage && (
				<p className="googlesitekit-error-text">{ errorMessage }</p>
			) }
			{ settingsView && (
				<Fragment>
					<UserInputQuestionAuthor slug={ slug } />
					{ saveSettingsError && (
						<ErrorNotice error={ saveSettingsError } />
					) }
					<div className="googlesitekit-user-input__preview-actions">
						<SpinnerButton
							disabled={ answerHasError }
							onClick={
								hasSettingChanged
									? submitChanges
									: toggleEditMode
							}
							isSaving={ isScreenLoading }
						>
							{ hasSettingChanged || isSavingSettings
								? __( 'Apply changes', 'google-site-kit' )
								: __( 'Save', 'google-site-kit' ) }
						</SpinnerButton>
						<Button
							tertiary
							disabled={ isScreenLoading }
							onClick={ handleOnCancelClick }
						>
							{ __( 'Cancel', 'google-site-kit' ) }
						</Button>
					</div>
				</Fragment>
			) }
		</Fragment>
	);
}
