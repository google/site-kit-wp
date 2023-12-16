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
import { Button } from 'googlesitekit-components';
import SurveyHeader from './SurveyHeader';
import SurveyQuestionSingleSelectChoice from './SurveyQuestionSingleSelectChoice';

function SurveyQuestionSingleSelect( {
	question,
	choices,
	answerQuestion,
	dismissSurvey,
	submitButtonText,
} ) {
	const [ value, setValue ] = useState( '' );
	const [ writeIn, setWriteIn ] = useState( '' );

	const mappedChoices = choices.map( ( choice ) => ( {
		...choice,
		// Radio requires value prop to be a string.
		answer_ordinal: `${ choice.answer_ordinal }`,
	} ) );

	const currentSelectedOptionHasWriteIn =
		!! value &&
		mappedChoices.filter(
			(
				{ answer_ordinal, write_in } // eslint-disable-line camelcase
			) => answer_ordinal === value && write_in // eslint-disable-line camelcase
		).length > 0;

	const handleSubmit = () => {
		const answerTextOptionalKey = currentSelectedOptionHasWriteIn
			? { answer_text: writeIn }
			: {};
		answerQuestion( {
			answer: {
				answer_ordinal: Number( value ),
				...answerTextOptionalKey,
			},
		} );
	};

	const isSubmitButtonDisabled =
		value === '' || ( currentSelectedOptionHasWriteIn && writeIn === '' );

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
					{ submitButtonText }
				</Button>
			</div>
		</div>
	);
}

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
