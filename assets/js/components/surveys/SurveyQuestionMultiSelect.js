/**
 * SurveyQuestionMultiSelect component.
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
import keyBy from 'lodash/keyBy';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../Button';
// I don't see this used anywhere else. MaterialUI default better?
import Checkbox from '../Checkbox';
import SurveyHeader from './SurveyHeader';

// Why have this rule enabled if we get this from the APIs *and* send back to the APIs like this?
/* eslint-disable camelcase */

const SurveyQuestionMultiSelect = ( { question, choices, answerQuestion, dismissSurvey } ) => {
	// const initialState = choices.map( ( { answer_ordinal, write_in } ) => {
	// 	if ( write_in ) {
	// 		return { answer_ordinal, answer_text: ''	};
	// 	}
	// 	return { answer_ordinal };
	// } );

	const mappedChoices = choices.map( ( { answer_ordinal, write_in } ) => {
		const optionalKeys = write_in ? { answer_text: ''	} : {};

		return {
			answer_ordinal,
			selected: false,
			...optionalKeys,
		};
	} );

	const initialState = keyBy( mappedChoices, 'answer_ordinal' );

	const [ selectedValues, setSelectedValues ] = useState( initialState );

	const handleSubmit = () => {
		answerQuestion( {} );
	};
	const handleCheck = ( answer_ordinal ) => {
		console.log( answer_ordinal );
		// not going to work! needs to be object
		// setSelectedValues( {
		// 	selectedValues,
		// } );
	};

	return (
		<div className="googlesitekit-survey__multi-select">
			<SurveyHeader
				title={ question }
				dismissSurvey={ dismissSurvey }
			/>

			<div className="googlesitekit-survey__body">
				{ choices.map( ( { answer_ordinal, text, write_in } ) => (
					<Checkbox
						key={ text }
						checked={ false }
						onChange={ () => handleCheck( answer_ordinal ) }
						value={ `${ answer_ordinal }` }
						id={ text }
						name={ text }
					>
						{ text }
					</Checkbox>
				) ) }
			</div>

			<div className="googlesitekit-survey__footer">
				<Button
					onClick={ handleSubmit }
				>
					Next
				</Button>
			</div>
		</div>
	);
};

SurveyQuestionMultiSelect.propTypes = {
	question: PropTypes.string.isRequired,
	choices: PropTypes.arrayOf(
		PropTypes.shape( {
			answer_ordinal: PropTypes.oneOfType( [
				PropTypes.string,
				PropTypes.number,
			] ),
			text: PropTypes.string,
			write_in: PropTypes.bool,
		} ),
	).isRequired,
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
};

export default SurveyQuestionMultiSelect;
