/**
 * SurveyQuestionRating component.
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
import { useCallback } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../components/Button';
import SurveyHeader from './SurveyHeader';
import SurveyUnhappy from '../../../svg/survey-unhappy.svg';
import SurveyDissatisfied from '../../../svg/survey-dissatisfied.svg';
import SurveyNeutral from '../../../svg/survey-neutral.svg';
import SurveySatisfied from '../../../svg/survey-satisfied.svg';
import SurveyDelighted from '../../../svg/survey-delighted.svg';

const SurveyQuestionRating = ( { question, choices, answerQuestion, dismissSurvey } ) => {
	const getIcon = ( answerOrdinal ) => {
		if ( ! answerOrdinal ) {
			return null;
		}

		switch ( parseInt( answerOrdinal, 10 ) ) {
			case 1:
				return <SurveyUnhappy />;
			case 2:
				return <SurveyDissatisfied />;
			case 3:
				return <SurveyNeutral />;
			case 4:
				return <SurveySatisfied />;
			case 5:
				return <SurveyDelighted />;
		}
	};

	const handleButtonClick = useCallback( ( answer ) => {
		if ( typeof answerQuestion === 'function' ) {
			answerQuestion( answer );
		}
	}, [ answerQuestion ] );

	return (
		<div className="googlesitekit-survey__question-rating">
			<SurveyHeader
				title={ question }
				dismissSurvey={ dismissSurvey }
			/>

			<div className="googlesitekit-survey__body">
				<div className="googlesitekit-survey__choices">
					{ choices.map( ( choice, index ) => (
						<div className="googlesitekit-survey__choice" key={ index }>
							<Button
								icon={ getIcon( choice.answer_ordinal ) }
								aria-label={
									sprintf(
										/* translators: %s: Icon Expression */
										__( '%s icon', 'google-site-kit' ),
										choice.text,
									)
								}
								onClick={ handleButtonClick.bind( null, choice.answer_ordinal ) }
							/>

							<p>
								{ choice.text }
							</p>
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
};

SurveyQuestionRating.propTypes = {
	question: PropTypes.string.isRequired,
	choices: PropTypes.arrayOf(
		PropTypes.shape( {
			answer_ordinal: PropTypes.oneOfType( [
				PropTypes.string,
				PropTypes.number,
			] ),
			text: PropTypes.string,
		} ),
	),
	answerQuestion: PropTypes.func,
	dismissSurvey: PropTypes.func,
};

SurveyQuestionRating.defaultProps = {
	choices: [],
	answerQuestion: null,
	dismissSurvey: null,
};

export default SurveyQuestionRating;
