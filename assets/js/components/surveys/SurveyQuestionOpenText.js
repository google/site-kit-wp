/**
 * SurveyQuestionOpenText component.
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
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SurveyHeader from './SurveyHeader';
import { TextField, Input, HelperText } from '../../material-components';
import Button from '../Button';

const SurveyQuestionOpenText = ( {
	question,
	answerQuestion,
	dismissSurvey } ) => {
	const [ value, setValue ] = useState( '' );

	const onChange = useCallback( ( event ) => {
		setValue( event.target.value );
	}, [ setValue ] );

	return (
		<div className="googlesitekit-survey__open-text">
			<SurveyHeader
				title={ question }
				dismissSurvey={ dismissSurvey }
			/>

			<div className="googlesitekit-survey__body">
				<TextField
					name="siteProperty"
					helperText={
						<HelperText>
							{ __( 'Don\'t include personal information', 'google-site-kit' ) }
						</HelperText>
					}
					onChange={ onChange }
				>
					<Input
						value={ value }
					/>
				</TextField>
			</div>
			<div className="googlesitekit-survey__footer">
				<Button onClick={ answerQuestion }>{ __( 'Submit', 'google-site-kit' ) }</Button>
			</div>
		</div>
	);
};

SurveyQuestionOpenText.propTypes = {
	question: PropTypes.string.isRequired,
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
};

export default SurveyQuestionOpenText;
