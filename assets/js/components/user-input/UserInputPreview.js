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
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ProgressBar, SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import {
	getUserInputAnswers,
	USER_INPUT_QUESTIONS_GOALS,
	USER_INPUT_QUESTIONS_PURPOSE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTIONS_LIST,
	USER_INPUT_MAX_ANSWERS,
	USER_INPUT_CURRENTLY_EDITING_KEY,
} from './util/constants';
import UserInputPreviewGroup from './UserInputPreviewGroup';
import UserInputQuestionNotice from './UserInputQuestionNotice';
import useQueryArg from '../../hooks/useQueryArg';
import ErrorNotice from '../ErrorNotice';
import Link from '../Link';
import CancelUserInputButton from './CancelUserInputButton';
import { getErrorMessageForAnswer } from './util/validation';
import { Row, Cell } from '../../material-components';
const { useSelect } = Data;

export default function UserInputPreview( props ) {
	const {
		noFooter,
		goBack,
		submitChanges,
		error,
		noHeader,
		settingsView = false,
		showIndividualCTAs = false,
	} = props;
	const previewContainer = useRef();
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

	const [ errorMessages, setErrorMessages ] = useState( {
		[ USER_INPUT_QUESTIONS_GOALS ]: null,
		[ USER_INPUT_QUESTIONS_PURPOSE ]: null,
		[ USER_INPUT_QUESTION_POST_FREQUENCY ]: null,
	} );

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

	if ( undefined === settings ) {
		return <ProgressBar />;
	}

	const updateErrorMessages = () => {
		const newErrorMessages = USER_INPUT_QUESTIONS_LIST.reduce(
			( errors, slug ) => {
				const errorMessage = getErrorMessageForAnswer(
					settings?.[ slug ]?.values || [],
					USER_INPUT_MAX_ANSWERS[ slug ]
				);
				errors[ slug ] = errorMessage;
				return errors;
			},
			{}
		);

		setErrorMessages( newErrorMessages );

		return newErrorMessages;
	};

	const onSaveClick = () => {
		const newErrorMessages = updateErrorMessages();

		const hasErrors = Object.values( newErrorMessages ).some( Boolean );
		if ( ! hasErrors ) {
			submitChanges();
		}
	};

	return (
		<div
			className={ classnames( 'googlesitekit-user-input__preview', {
				'googlesitekit-user-input__preview--editing': isEditing,
			} ) }
			ref={ previewContainer }
		>
			<div className="googlesitekit-user-input__preview-contents">
				{ ! noHeader && (
					<p className="googlesitekit-user-input__preview-subheader">
						{ __( 'Review your answers', 'google-site-kit' ) }
					</p>
				) }
				{ settingsView && (
					<Row>
						<Cell>
							<p className="googlesitekit-settings-user-input__heading">
								{ __(
									'Edit your answers for more personalized metrics:',
									'google-site-kit'
								) }
							</p>
						</Cell>
					</Row>
				) }
				<UserInputPreviewGroup
					slug={ USER_INPUT_QUESTIONS_PURPOSE }
					title={ __(
						'What is the main purpose of this site?',
						'google-site-kit'
					) }
					values={ settings?.purpose?.values || [] }
					options={ USER_INPUT_ANSWERS_PURPOSE }
					errorMessage={
						errorMessages[ USER_INPUT_QUESTIONS_PURPOSE ]
					}
					onCollapse={ updateErrorMessages }
					showIndividualCTAs={ showIndividualCTAs }
				/>

				<UserInputPreviewGroup
					slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
					title={ __(
						'How often do you create new content for this site?',
						'google-site-kit'
					) }
					values={ settings?.postFrequency?.values || [] }
					options={ USER_INPUT_ANSWERS_POST_FREQUENCY }
					errorMessage={
						errorMessages[ USER_INPUT_QUESTION_POST_FREQUENCY ]
					}
					onCollapse={ updateErrorMessages }
					showIndividualCTAs={ showIndividualCTAs }
				/>

				<UserInputPreviewGroup
					slug={ USER_INPUT_QUESTIONS_GOALS }
					title={ __(
						'What are your top goals for this site?',
						'google-site-kit'
					) }
					values={ settings?.goals?.values || [] }
					options={ USER_INPUT_ANSWERS_GOALS }
					errorMessage={ errorMessages[ USER_INPUT_QUESTIONS_GOALS ] }
					onCollapse={ updateErrorMessages }
					showIndividualCTAs={ showIndividualCTAs }
				/>

				{ error && <ErrorNotice error={ error } /> }
			</div>

			{ ! noFooter && (
				<Fragment>
					<div className="googlesitekit-user-input__preview-notice">
						<UserInputQuestionNotice />
					</div>
					<div className="googlesitekit-user-input__footer googlesitekit-user-input__buttons">
						<div className="googlesitekit-user-input__footer-nav">
							<SpinnerButton
								className="googlesitekit-user-input__buttons--next"
								onClick={ onSaveClick }
								disabled={ isScreenLoading }
								isSaving={ isScreenLoading }
							>
								{ __( 'Save', 'google-site-kit' ) }
							</SpinnerButton>
							<Link
								className="googlesitekit-user-input__buttons--back"
								onClick={ goBack }
								disabled={ isScreenLoading }
							>
								{ __( 'Back', 'google-site-kit' ) }
							</Link>
						</div>
						<div className="googlesitekit-user-input__footer-cancel">
							<CancelUserInputButton
								disabled={ isScreenLoading }
							/>
						</div>
					</div>
				</Fragment>
			) }
		</div>
	);
}

UserInputPreview.propTypes = {
	submitChanges: PropTypes.func,
	noFooter: PropTypes.bool,
	goBack: PropTypes.func,
	redirectURL: PropTypes.string,
	errors: PropTypes.object,
	noHeader: PropTypes.bool,
	settingsView: PropTypes.bool,
	showIndividualCTAs: PropTypes.bool,
};
