/**
 * User Input Preview.
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
import { __ } from '@wordpress/i18n';
import {
	Fragment,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import {
	getUserInputAnswers,
	USER_INPUT_QUESTIONS_GOALS,
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_QUESTIONS_LIST,
	FORM_USER_INPUT_QUESTION_SNAPSHOT,
} from './util/constants';
import UserInputPreviewGroup from './UserInputPreviewGroup';
import UserInputQuestionNotice from './UserInputQuestionNotice';
import useQueryArg from '../../hooks/useQueryArg';
import ErrorNotice from '../ErrorNotice';
import LoadingWrapper from '../LoadingWrapper';
import CancelUserInputButton from './CancelUserInputButton';
import { hasErrorForAnswer } from './util/validation';
import Portal from '../Portal';
import ConfirmSitePurposeChangeModal from '../KeyMetrics/ConfirmSitePurposeChangeModal';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';

export default function UserInputPreview( props ) {
	const {
		goBack,
		submitChanges,
		error,
		loading = false,
		settingsView = false,
	} = props;
	const previewContainer = useRef();
	const [ isModalOpen, toggleIsModalOpen ] = useState( false );
	const handleModal = useCallback( () => {
		toggleIsModalOpen( false );
	}, [ toggleIsModalOpen ] );
	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettings()
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingUserInputSettings( settings )
	);
	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigating()
	);
	const isEditing = useSelect(
		( select ) =>
			!! select( CORE_UI ).getValue( USER_INPUT_CURRENTLY_EDITING_KEY )
	);
	const isScreenLoading = isSavingSettings || isNavigating;

	const {
		USER_INPUT_ANSWERS_PURPOSE,
		USER_INPUT_ANSWERS_POST_FREQUENCY,
		USER_INPUT_ANSWERS_GOALS,
	} = getUserInputAnswers();

	const [ page ] = useQueryArg( 'page' );

	const hasError = USER_INPUT_QUESTIONS_LIST.some( ( slug ) =>
		hasErrorForAnswer( settings?.[ slug ]?.values || [] )
	);

	const onSaveClick = useCallback( () => {
		if ( hasError || isScreenLoading ) {
			return;
		}

		submitChanges();
	}, [ hasError, isScreenLoading, submitChanges ] );

	const { saveUserInputSettings } = useDispatch( CORE_USER );

	const savedPurpose = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_USER_INPUT_QUESTION_SNAPSHOT,
			USER_INPUT_QUESTIONS_PURPOSE
		)
	);

	const currentMetrics = useSelect( ( select ) => {
		if ( savedPurpose === undefined ) {
			return [];
		}

		return select( CORE_USER ).getAnswerBasedMetrics( savedPurpose[ 0 ] );
	} );

	const newMetrics = useSelect( ( select ) => {
		return select( CORE_USER ).getKeyMetrics();
	} );

	const { resetUserInputSettings } = useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_FORMS );
	const { setValues: setUIValues } = useDispatch( CORE_UI );

	const openModalIfMetricsChanged = async () => {
		const differenceInMetrics = newMetrics.filter(
			( x ) => ! currentMetrics.includes( x )
		);

		if ( 0 !== differenceInMetrics.length ) {
			toggleIsModalOpen( true );
		} else {
			// Save the settings.
			await saveUserInputSettings();

			if ( savedPurpose?.length ) {
				await resetUserInputSettings();
				setValues( FORM_USER_INPUT_QUESTION_SNAPSHOT, {
					[ USER_INPUT_QUESTIONS_PURPOSE ]: undefined,
				} );
			}
			setUIValues( {
				[ USER_INPUT_CURRENTLY_EDITING_KEY ]: undefined,
			} );
		}
	};

	useEffect( () => {
		if (
			! previewContainer?.current ||
			page?.startsWith( 'googlesitekit-settings' )
		) {
			return;
		}

		const buttonEl =
			previewContainer.current.querySelector( '.mdc-button' );
		if ( buttonEl ) {
			setTimeout( () => {
				buttonEl.focus();
			}, 50 );
		}
	}, [ page ] );

	return (
		<div
			className={ classnames( 'googlesitekit-user-input__preview', {
				'googlesitekit-user-input__preview--editing': isEditing,
			} ) }
			ref={ previewContainer }
		>
			<div className="googlesitekit-user-input__preview-contents">
				{ ! settingsView && (
					<p className="googlesitekit-user-input__preview-subheader">
						{ __( 'Review your answers', 'google-site-kit' ) }
					</p>
				) }
				{ settingsView && (
					<div className="googlesitekit-settings-user-input__heading-container">
						<LoadingWrapper
							loading={ loading }
							width="275px"
							height="16px"
						>
							<p className="googlesitekit-settings-user-input__heading">
								{ __(
									'Edit your answers for more personalized metrics:',
									'google-site-kit'
								) }
							</p>
						</LoadingWrapper>
					</div>
				) }
				<UserInputPreviewGroup
					slug={ USER_INPUT_QUESTIONS_PURPOSE }
					title={ __(
						'What is the main purpose of this site?',
						'google-site-kit'
					) }
					values={ settings?.purpose?.values || [] }
					options={ USER_INPUT_ANSWERS_PURPOSE }
					loading={ loading }
					settingsView={ settingsView }
					onChange={ () => openModalIfMetricsChanged() }
				/>

				<UserInputPreviewGroup
					slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
					title={ __(
						'How often do you create new content for this site?',
						'google-site-kit'
					) }
					values={ settings?.postFrequency?.values || [] }
					options={ USER_INPUT_ANSWERS_POST_FREQUENCY }
					loading={ loading }
					settingsView={ settingsView }
				/>

				<UserInputPreviewGroup
					slug={ USER_INPUT_QUESTIONS_GOALS }
					title={ __(
						'What are your top goals for this site?',
						'google-site-kit'
					) }
					values={ settings?.goals?.values || [] }
					options={ USER_INPUT_ANSWERS_GOALS }
					loading={ loading }
					settingsView={ settingsView }
				/>

				{ error && <ErrorNotice error={ error } /> }
			</div>

			{ ! settingsView && (
				<Fragment>
					<div className="googlesitekit-user-input__preview-notice">
						<UserInputQuestionNotice />
					</div>
					<div className="googlesitekit-user-input__footer googlesitekit-user-input__buttons">
						<div className="googlesitekit-user-input__footer-nav">
							<SpinnerButton
								className="googlesitekit-user-input__buttons--next"
								onClick={ onSaveClick }
								disabled={ hasError || isScreenLoading }
								isSaving={ isScreenLoading }
							>
								{ __( 'Save', 'google-site-kit' ) }
							</SpinnerButton>
							<Button
								tertiary
								className="googlesitekit-user-input__buttons--back"
								onClick={ goBack }
								disabled={ isScreenLoading }
							>
								{ __( 'Back', 'google-site-kit' ) }
							</Button>
						</div>
						<div className="googlesitekit-user-input__footer-cancel">
							<CancelUserInputButton
								disabled={ isScreenLoading }
							/>
						</div>
					</div>
				</Fragment>
			) }
			<Portal>
				<ConfirmSitePurposeChangeModal
					dialogActive={ isModalOpen }
					handleDialog={ handleModal }
				/>
			</Portal>
		</div>
	);
}

UserInputPreview.propTypes = {
	submitChanges: PropTypes.func,
	goBack: PropTypes.func,
	error: PropTypes.object,
	loading: PropTypes.bool,
	settingsView: PropTypes.bool,
};
