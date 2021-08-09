/**
 * SurveyQuestionSingleSelect component.
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../Button';
import SurveyHeader from './SurveyHeader';
// import { TextField, Input } from '../../material-components';
import SurveyQuestionSingleSelectChoice from './SurveyQuestionSingleSelectChoice';

// const MAXIMUM_CHARACTER_LIMIT = 100;

/* eslint-disable camelcase */

const SurveyQuestionSingleSelect = ( {
	question,
	choices,
	answerQuestion,
	dismissSurvey,
} ) => {
	const [ value, setValue ] = useState( '' ); // eslint-disable-line
	const [ writeIn, setWriteIn ] = useState( '' ); // eslint-disable-line

	const mappedChoices = choices.map( ( choice ) => ( {
		...choice,
		answer_ordinal: `${ choice.answer_ordinal }`,
	} ) );

	const handleSubmit = () => {
		answerQuestion( {
			answer: {
				answer_ordinal: value,
				// TODO - only add this if has been set. Edge cases with this implementation
				answer_text: writeIn,
			},
		} );
	};
	const isSubmitButtonDisabled = value === '' || writeIn === '';

	return (
		<div className="googlesitekit-single-select">
			<SurveyHeader title={ question } dismissSurvey={ dismissSurvey } />
			<div className="googlesitekit-survey__body">
				{ mappedChoices.map( ( choice, id ) => (
					<SurveyQuestionSingleSelectChoice
						key={ id }
						value={ value }
						setValue={ setValue }
						writeIn={ writeIn }
						setWriteIn={ setWriteIn }
						choice={ choice }
					/>
				) ) }
			</div>
			<div className="googlesitekit-survey__footer">
				<Button
					onClick={ handleSubmit }
					disabled={ isSubmitButtonDisabled }
				>
					Next
				</Button>
			</div>
		</div>
	);
};

SurveyQuestionSingleSelect.propTypes = {
	question: PropTypes.string.isRequired,
	choices: PropTypes.arrayOf(
		PropTypes.shape( {
			answer_ordinal: PropTypes.oneOfType( [
				PropTypes.string,
				PropTypes.number,
			] ),
			text: PropTypes.string,
			write_in: PropTypes.bool,
		} )
	).isRequired,
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
};

export default SurveyQuestionSingleSelect;
