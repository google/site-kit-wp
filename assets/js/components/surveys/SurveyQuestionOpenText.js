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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SurveyHeader from './SurveyHeader';
import { TextField, Input } from '../../material-components';
import Button from '../Button';

const SurveyQuestionOpenText = ( {
	question,
	answerQuestion,
	dismissSurvey } ) => {
	return (
		<div className="googlesitekit-survey__open-text">
			<SurveyHeader
				title={ question }
				dismissSurvey={ dismissSurvey }
			/>

			<div className="googlesitekit-survey__body">
				<TextField
					label={ __( 'Website Address', 'google-site-kit' ) }
					name="siteProperty"
					// floatingLabelClassName="mdc-floating-label--float-above"
					// outlined
					// disabled
				>
					<Input
						// value={ siteURL }
					/>
				</TextField>
				<Button onClick={ answerQuestion }>{ __( 'Continue', 'google-site-kit' ) }</Button>

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
