/**
 * User Input Question Wrapper.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Row, Cell } from '../../material-components';
import UserInputQuestionInfo from './UserInputQuestionInfo';
import ErrorNotice from '../ErrorNotice';
import CancelUserInputButton from './CancelUserInputButton';
import { hasErrorForAnswer } from './util/validation';
import SpinnerButton from '../../googlesitekit/components-gm2/SpinnerButton';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import WarningSVG from '../../../svg/icons/warning.svg';

export default function UserInputQuestionWrapper( props ) {
	const { children, slug, questionNumber, next, back, complete, error } =
		props;

	const values = useSelect(
		( select ) => select( CORE_USER ).getUserInputSetting( slug ) || []
	);

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

	return (
		<div className="googlesitekit-user-input__question">
			<div className="googlesitekit-user-input__question-contents">
				<Row>
					<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
						<Row>
							<UserInputQuestionInfo
								slug={ slug }
								questionNumber={ questionNumber }
							/>

							{ children }
						</Row>
					</Cell>
				</Row>
			</div>

			{ error && (
				<div className="googlesitekit-user-input__error">
					<ErrorNotice error={ error } Icon={ WarningSVG } />
				</div>
			) }

			<div className="googlesitekit-user-input__footer googlesitekit-user-input__buttons">
				<div className="googlesitekit-user-input__footer-nav">
					{ back && (
						<Button
							tertiary
							className="googlesitekit-user-input__buttons--back"
							onClick={ back }
						>
							{ __( 'Back', 'google-site-kit' ) }
						</Button>
					) }
					{ next && (
						<Button
							className="googlesitekit-user-input__buttons--next"
							onClick={ next }
							disabled={ hasErrorForAnswer( values ) }
						>
							{ __( 'Next', 'google-site-kit' ) }
						</Button>
					) }
					{ complete && (
						<SpinnerButton
							className="googlesitekit-user-input__buttons--complete"
							onClick={ complete }
							isSaving={ isScreenLoading }
							disabled={ hasErrorForAnswer( values ) }
						>
							{ createInterpolateElement(
								__(
									'Complete<span> setup</span>',
									'google-site-kit'
								),
								{
									span: (
										<span className="googlesitekit-user-input__responsive-text" />
									),
								}
							) }
						</SpinnerButton>
					) }
				</div>

				<div className="googlesitekit-user-input__footer-cancel">
					<CancelUserInputButton />
				</div>
			</div>
		</div>
	);
}

UserInputQuestionWrapper.propTypes = {
	slug: PropTypes.string.isRequired,
	questionNumber: PropTypes.number.isRequired,
	children: PropTypes.node,
	description: PropTypes.string,
	next: PropTypes.func,
	back: PropTypes.func,
	complete: PropTypes.func,
	error: PropTypes.object,
};
