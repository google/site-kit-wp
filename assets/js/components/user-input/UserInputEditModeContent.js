/**
 * User Input Preview Answers.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, SpinnerButton } from 'googlesitekit-components';

/**
 * Internal dependencies
 */
import UserInputSelectOptions from './UserInputSelectOptions';
import ErrorNotice from '../ErrorNotice';
import UserInputQuestionAuthor from './UserInputQuestionAuthor';
import {
	getUserInputAnswersDescription,
	USER_INPUT_MAX_ANSWERS,
} from './util/constants';

export default function UserInputEditModeContent( {
	slug,
	options,
	errorMessage,
	isSavingSettings,
	isScreenLoading,
	saveSettingsError,
	answerHasError,
	settingsView,
	hasSettingChanged,
	submitChanges,
	toggleEditMode,
	handleOnCancelClick,
} ) {
	const {
		USER_INPUT_ANSWERS_PURPOSE: USER_INPUT_ANSWERS_PURPOSE_DESCRIPTIONS,
	} = getUserInputAnswersDescription();

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
