/**
 * SurveyQuestionSingleSelectChoice component.
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
import { Fragment } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Radio, TextField } from 'googlesitekit-components';
import VisuallyHidden from '../VisuallyHidden';
import { SURVEY_INPUT_MAX_CHARACTER_LIMIT } from './constants';

function SurveyQuestionSingleSelectChoice( {
	value,
	setValue,
	writeIn,
	setWriteIn,
	choice,
} ) {
	const { answer_ordinal, text, write_in } = choice; // eslint-disable-line camelcase
	const isChecked = value === answer_ordinal; // eslint-disable-line camelcase
	const uniqueID = `googlesitekit-survey__multi-select-${ answer_ordinal }-${ text }`; // eslint-disable-line camelcase

	return (
		<div className="googlesitekit-single-select__choice">
			<Radio
				id={ text.replace( / /g, '-' ) }
				value={ answer_ordinal } // eslint-disable-line camelcase
				checked={ isChecked }
				name={ text }
				onClick={ () => setValue( answer_ordinal ) }
			>
				{ text }
			</Radio>
			{ write_in && ( // eslint-disable-line camelcase
				<Fragment>
					<VisuallyHidden>
						<label htmlFor={ uniqueID }>
							{ sprintf(
								/* translators: %s: Option name */
								__(
									'Text input for option %s',
									'google-site-kit'
								),
								text
							) }
						</label>
					</VisuallyHidden>
					<TextField
						id={ uniqueID }
						onChange={ ( event ) =>
							setWriteIn(
								event.target.value.slice(
									0,
									SURVEY_INPUT_MAX_CHARACTER_LIMIT
								)
							)
						}
						value={ writeIn }
						disabled={ ! isChecked }
					/>
				</Fragment>
			) }
		</div>
	);
}

SurveyQuestionSingleSelectChoice.propTypes = {
	choice: PropTypes.shape( {
		answer_ordinal: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.number,
		] ),
		text: PropTypes.string,
		write_in: PropTypes.bool,
	} ),
	value: PropTypes.string.isRequired,
	setValue: PropTypes.func.isRequired,
	writeIn: PropTypes.string.isRequired,
	setWriteIn: PropTypes.func.isRequired,
};

export default SurveyQuestionSingleSelectChoice;
