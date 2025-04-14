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
import { useEffect, useCallback, useRef } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../util';
import { getErrorMessageForAnswer } from './util/validation';
import useViewContext from '../../hooks/useViewContext';
import {
	FORM_USER_INPUT_QUESTION_SNAPSHOT,
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_MAX_ANSWERS,
	USER_INPUT_QUESTIONS_PURPOSE,
} from './util/constants';
import Link from '../Link';
import LoadingWrapper from '../LoadingWrapper';
import ChevronDownIcon from '../../../svg/icons/chevron-down.svg';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import UserInputPreviewAnswers from './UserInputPreviewAnswers';
import UserInputEditModeContent from './UserInputEditModeContent';

export default function UserInputPreviewGroup( {
	slug,
	title,
	subtitle,
	values,
	options = {},
	loading = false,
	settingsView = false,
	onChange,
} ) {
	const viewContext = useViewContext();
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const currentlyEditingSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_INPUT_CURRENTLY_EDITING_KEY )
	);
	const isSavingSettings = useSelect( ( select ) => {
		const userInputSettings = select( CORE_USER ).getUserInputSettings();

		return select( CORE_USER ).isSavingUserInputSettings(
			userInputSettings
		);
	} );
	const savedPurposeAnswer = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_USER_INPUT_QUESTION_SNAPSHOT,
			USER_INPUT_QUESTIONS_PURPOSE
		)
	);
	const previousPurposeAnswer = usePrevious( savedPurposeAnswer );

	useEffect( () => {
		// If user purpose is opened currently saved value was snapshot
		// and it will differ from previous value. Once modal is closed
		// the edit button will be toggled, and snapshotted value will be undefined
		// while previously it had value, that will mark that modal is closed and we should
		// return focus to the edit button.
		if (
			slug === USER_INPUT_QUESTIONS_PURPOSE &&
			previousPurposeAnswer !== savedPurposeAnswer &&
			savedPurposeAnswer === undefined
		) {
			setTimeout( () => {
				editButtonRef.current?.focus?.();
			}, 100 );
		}
	}, [ savedPurposeAnswer, previousPurposeAnswer, slug ] );

	const { setValues } = useDispatch( CORE_UI );
	const { resetUserInputSettings } = useDispatch( CORE_USER );

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

	const editButtonRef = useRef();

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

	const Subtitle = typeof subtitle === 'function' ? subtitle : undefined;

	return (
		<div
			className={ classnames( 'googlesitekit-user-input__preview-group', {
				'googlesitekit-user-input__preview-group--editing': isEditing,
				'googlesitekit-user-input__preview-group--individual-cta':
					settingsView,
			} ) }
		>
			<div
				className={ classnames(
					'googlesitekit-user-input__preview-group-title',
					{
						'googlesitekit-user-input__preview-group-title-with-subtitle':
							Subtitle || subtitle,
					}
				) }
			>
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
						trailingIcon={
							<ChevronDownIcon width={ 20 } height={ 20 } />
						}
					>
						{ isEditing && __( 'Close', 'google-site-kit' ) }
						{ ! isEditing && __( 'Edit', 'google-site-kit' ) }
					</Link>
				</LoadingWrapper>
			</div>

			<LoadingWrapper>
				<div className="googlesitekit-user-input__preview-group-subtitle">
					{ Subtitle && (
						<div className="googlesitekit-user-input__preview-group-subtitle-component">
							<Subtitle />
						</div>
					) }
					{ ! Subtitle && <p>{ subtitle }</p> }
				</div>
			</LoadingWrapper>

			{ ! isEditing && (
				<UserInputPreviewAnswers
					values={ values }
					options={ options }
					loading={ loading }
					errorMessage={ errorMessage }
				/>
			) }
			{ isEditing && (
				<UserInputEditModeContent
					slug={ slug }
					options={ options }
					onChange={ onChange }
					settingsView={ settingsView }
					values={ values }
				/>
			) }
		</div>
	);
}

UserInputPreviewGroup.propTypes = {
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.elementType,
	] ),
	values: PropTypes.arrayOf( PropTypes.string ).isRequired,
	options: PropTypes.shape( {} ),
	loading: PropTypes.bool,
	settingsView: PropTypes.bool,
	onChange: PropTypes.func,
};
