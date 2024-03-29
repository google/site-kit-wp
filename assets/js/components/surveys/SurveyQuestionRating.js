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

/**
 * Internal dependencies
 */
import SurveyHeader from './SurveyHeader';
import SurveyQuestionRatingChoice from './SurveyQuestionRatingChoice';

function SurveyQuestionRating( {
	question,
	choices,
	answerQuestion,
	dismissSurvey,
} ) {
	return (
		<div className="googlesitekit-survey__question-rating">
			<SurveyHeader title={ question } dismissSurvey={ dismissSurvey } />

			<div className="googlesitekit-survey__body">
				<div className="googlesitekit-survey__choices">
					{ choices.map( ( choice, index ) => (
						<SurveyQuestionRatingChoice
							key={ index }
							choice={ choice }
							answerQuestion={ answerQuestion }
						/>
					) ) }
				</div>
			</div>
		</div>
	);
}

SurveyQuestionRating.propTypes = {
	question: PropTypes.string.isRequired,
	choices: PropTypes.arrayOf(
		PropTypes.shape( {
			answer_ordinal: PropTypes.oneOfType( [
				PropTypes.string,
				PropTypes.number,
			] ),
			text: PropTypes.string,
		} )
	).isRequired,
	answerQuestion: PropTypes.func.isRequired,
	dismissSurvey: PropTypes.func.isRequired,
};

export default SurveyQuestionRating;
