/**
 * User Input Preview Group.
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../util';
import { getErrorMessageForAnswer, hasErrorForAnswer } from './util/validation';
import useViewContext from '../../hooks/useViewContext';
import {
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_MAX_ANSWERS,
} from './util/constants';
import ErrorNotice from '../ErrorNotice';
import Link from '../Link';
import LoadingWrapper from '../LoadingWrapper';
import UserInputSelectOptions from './UserInputSelectOptions';
import UserInputQuestionAuthor from './UserInputQuestionAuthor';
import ChevronDownIcon from '../../../svg/icons/chevron-down.svg';

const { useSelect, useDispatch } = Data;

export default function UserInputPreviewGroup( {
	slug,
	title,
	values,
	options = {},
	loading = false,
	settingsView = false,
} ) {
	const viewContext = useViewContext();
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const currentlyEditingSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_INPUT_CURRENTLY_EDITING_KEY )
	);
	const hasSettingChanged = useSelect( ( select ) =>
		select( CORE_USER ).hasUserInputSettingChanged( slug )
	);
	const isSavingSettings = useSelect( ( select ) => {
		const userInputSettings = select( CORE_USER ).getUserInputSettings();

		return select( CORE_USER ).isSavingUserInputSettings(
			userInputSettings
		);
	} );
	const saveSettingsError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserInputSettings', [] )
	);
	const { setValues } = useDispatch( CORE_UI );
	const { saveUserInputSettings, resetUserInputSettings } =
		useDispatch( CORE_USER );

	const isEditing = currentlyEditingSlug === slug;

	const isScreenLoading = isSavingSettings || isNavigating;

	const gaEventCategory = `${ viewContext }_kmw`;

	const toggleEditMode = useCallback( () => {
		if ( isEditing ) {
			setValues( {
				[ USER_INPUT_CURRENTLY_EDITING_KEY ]: undefined,
			} );
			editButtonRef.current?.focus?.();
		} else {
			trackEvent( gaEventCategory, 'question_edit', slug );
			setValues( {
				[ USER_INPUT_CURRENTLY_EDITING_KEY ]: slug,
			} );
		}
	}, [ gaEventCategory, isEditing, setValues, slug ] );

	const errorMessage = getErrorMessageForAnswer(
		values,
		USER_INPUT_MAX_ANSWERS[ slug ]
	);

	const answerHasError = hasErrorForAnswer( values );

	const editButtonRef = useRef();

	const submitChanges = useCallback( async () => {
		if ( answerHasError ) {
			return;
		}

		const response = await saveUserInputSettings();

		if ( ! response.error ) {
			trackEvent( gaEventCategory, 'question_update', slug );
			toggleEditMode();
		}
	}, [
		answerHasError,
		gaEventCategory,
		saveUserInputSettings,
		slug,
		toggleEditMode,
	] );

	const handleOnEditClick = useCallback( async () => {
		if ( settingsView ) {
			if (
				isScreenLoading ||
				( !! currentlyEditingSlug && ! isEditing )
			) {
				return;
			}

			// Do not preserve changes if preview group is collapsed with individual CTAs.
			if ( isEditing ) {
				await resetUserInputSettings();
			}
		}

		toggleEditMode();
	}, [
		settingsView,
		isScreenLoading,
		currentlyEditingSlug,
		isEditing,
		resetUserInputSettings,
		toggleEditMode,
	] );

	const handleOnCancelClick = useCallback( async () => {
		if ( isScreenLoading ) {
			return;
		}

		await resetUserInputSettings();
		toggleEditMode();
	}, [ isScreenLoading, resetUserInputSettings, toggleEditMode ] );

	return (
		<div
			className={ classnames( 'googlesitekit-user-input__preview-group', {
				'googlesitekit-user-input__preview-group--editing': isEditing,
				'googlesitekit-user-input__preview-group--individual-cta':
					settingsView,
			} ) }
		>
			<div className="googlesitekit-user-input__preview-group-title">
				<LoadingWrapper loading={ loading } width="340px" height="21px">
					<p>{ title }</p>
				</LoadingWrapper>
				<LoadingWrapper
					loading={ loading }
					className="googlesitekit-margin-left-auto"
					width="60px"
					height="26px"
				>
					<Link
						secondary
						onClick={ handleOnEditClick }
						ref={ editButtonRef }
						disabled={
							isScreenLoading ||
							( !! currentlyEditingSlug && ! isEditing )
						}
						linkButton
						iconSuffix={
							<ChevronDownIcon width={ 20 } height={ 20 } />
						}
					>
						{ __( 'Edit', 'google-site-kit' ) }
					</Link>
				</LoadingWrapper>
			</div>

			{ ! isEditing && (
				<div className="googlesitekit-user-input__preview-answers">
					<LoadingWrapper
						loading={ loading }
						width="340px"
						height="36px"
					>
						{ errorMessage && (
							<p className="googlesitekit-error-text">
								{ errorMessage }
							</p>
						) }

						{ ! errorMessage &&
							values.map( ( value ) => (
								<div
									key={ value }
									className="googlesitekit-user-input__preview-answer"
								>
									{ options[ value ] }
								</div>
							) ) }
					</LoadingWrapper>
				</div>
			) }

			{ isEditing && (
				<Fragment>
					<UserInputSelectOptions
						slug={ slug }
						max={ USER_INPUT_MAX_ANSWERS[ slug ] }
						options={ options }
						alignLeftOptions
					/>
					{ errorMessage && (
						<p className="googlesitekit-error-text">
							{ errorMessage }
						</p>
					) }
					{ settingsView && (
						<Fragment>
							<UserInputQuestionAuthor slug={ slug } />

							{ saveSettingsError && (
								<ErrorNotice error={ saveSettingsError } />
							) }

							<div className="googlesitekit-user-input__preview-actions">
								<SpinnerButton
									disabled={
										! hasSettingChanged || answerHasError
									}
									onClick={
										hasSettingChanged
											? submitChanges
											: undefined
									}
									isSaving={ isScreenLoading }
								>
									{ __(
										'Confirm Changes',
										'google-site-kit'
									) }
								</SpinnerButton>
								<Link
									disabled={ isScreenLoading }
									onClick={ handleOnCancelClick }
								>
									{ __( 'Cancel', 'google-site-kit' ) }
								</Link>
							</div>
						</Fragment>
					) }
				</Fragment>
			) }
		</div>
	);
}

UserInputPreviewGroup.propTypes = {
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	values: PropTypes.arrayOf( PropTypes.string ).isRequired,
	options: PropTypes.shape( {} ),
	loading: PropTypes.bool,
	settingsView: PropTypes.bool,
};
