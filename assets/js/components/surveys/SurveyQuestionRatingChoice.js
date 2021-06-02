/**
 * SurveyQuestionRatingChoice component.
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
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../components/Button';
import IconSurveyUnhappy from '../../../svg/survey-unhappy.svg';
import IconSurveyDissatisfied from '../../../svg/survey-dissatisfied.svg';
import IconSurveyNeutral from '../../../svg/survey-neutral.svg';
import IconSurveySatisfied from '../../../svg/survey-satisfied.svg';
import IconSurveyDelighted from '../../../svg/survey-delighted.svg';

const ordinalIconMap = {
	1: IconSurveyUnhappy,
	2: IconSurveyDissatisfied,
	3: IconSurveyNeutral,
	4: IconSurveySatisfied,
	5: IconSurveyDelighted,
};

const SurveyQuestionRatingChoice = ( { choice, answerQuestion } ) => {
	const handleButtonClick = useCallback( () => {
		if ( typeof answerQuestion === 'function' ) {
			answerQuestion( choice );
		}
	}, [ answerQuestion, choice ] );

	const Icon = ordinalIconMap[ choice.answer_ordinal ];

	if ( ! Icon ) {
		return null;
	}

	return (
		<div className="googlesitekit-survey__choice">
			<Button
				icon={ <Icon width={ 30 } height={ 30 } /> }
				aria-label={
					sprintf(
						/* translators: %s: Icon Expression */
						__( '%s icon', 'google-site-kit' ),
						choice.text,
					)
				}
				onClick={ handleButtonClick }
			/>

			<p>
				{ choice.text }
			</p>
		</div>
	);
};

SurveyQuestionRatingChoice.propTypes = {
	choice: PropTypes.shape( {
		answer_ordinal: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.number,
		] ),
		text: PropTypes.string,
	} ).isRequired,
};

export default SurveyQuestionRatingChoice;
